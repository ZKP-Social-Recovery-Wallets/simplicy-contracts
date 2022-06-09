// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {SNARK_SCALAR_FIELD, MAX_DEPTH} from "./SemaphoreConstants.sol";
import {ISemaphoreGroupsInternal} from "./ISemaphoreGroupsInternal.sol";
import {SemaphoreGroupsBaseStorage} from "./SemaphoreGroupsBaseStorage.sol";
import {PoseidonT3} from "../../libraries/Hashes.sol";

/**
 * @title Base SemaphoreGroups internal functions, excluding optional extensions
 */
abstract contract SemaphoreGroupsBaseInternal is ISemaphoreGroupsInternal {
    using SemaphoreGroupsBaseStorage for SemaphoreGroupsBaseStorage.Layout;
    using SemaphoreGroupsBaseStorage for SemaphoreGroupsBaseStorage.IncrementalTreeData;

    modifier onlyGroupAdmin(uint256 groupId) {
        require(
            _getGroupAdmin(groupId) == msg.sender,
            "SemaphoreGroup: caller is not the group admin"
        );
        _;
    }

    /**
     * @notice See {ISemaphoreGroups-getRoot}
     */
    function _getRoot(uint256 groupId) internal view virtual returns (uint256) {
        return SemaphoreGroupsBaseStorage.layout().groups[groupId].root;
    }

    /**
     * @notice See {ISemaphoreGroups-getDepth}
     */
    function _getDepth(uint256 groupId) internal view virtual returns (uint8) {
        return SemaphoreGroupsBaseStorage.layout().groups[groupId].depth;
    }

    function _getZeroes(uint256 groupId, uint256 leafIndex)
        internal
        view
        returns (uint256)
    {
        return
            SemaphoreGroupsBaseStorage.layout().groups[groupId].zeroes[
                leafIndex
            ];
    }

    /**
     * @notice See {ISemaphoreGroups-getNumberOfLeaves}
     */
    function _getNumberOfLeaves(uint256 groupId)
        internal
        view
        virtual
        returns (uint256)
    {
        return
            SemaphoreGroupsBaseStorage.layout().groups[groupId].numberOfLeaves;
    }

    function _getGroupAdmin(uint256 groupId)
        internal
        view
        virtual
        returns (address)
    {
        return SemaphoreGroupsBaseStorage.layout().groupAdmins[groupId];
    }

    /**
     * @notice creates a new group by initializing the associated tree
     * @param groupId: group id of the group
     * @param depth: depth of the tree
     * @param zeroValue: zero value of the tree
     */
    function _createGroup(
        uint256 groupId,
        uint8 depth,
        uint256 zeroValue
    ) internal virtual {
        _init(groupId, depth, zeroValue);

        emit GroupCreated(groupId, depth, zeroValue);
    }

    function _setGroupAdmin(uint256 groupId, address admin) internal {
        SemaphoreGroupsBaseStorage.layout().setGroupAdmin(groupId, admin);
    }

    /**
     * @notice adds an identity commitment to an existing group
     * @param groupId: group id of the group
     * @param identityCommitment: New identity commitment
     */
    function _addMember(uint256 groupId, uint256 identityCommitment)
        internal
        virtual
    {
        require(
            _getDepth(groupId) != 0,
            "SemaphoreGroupsBaseInternal: group does not exist"
        );

        _insert(groupId, identityCommitment);

        uint256 root = _getRoot(groupId);

        emit MemberAdded(groupId, identityCommitment, root);
    }

    /**
     * @notice removes an identity commitment from an existing group. A proof of membership is
     * needed to check if the node to be deleted is part of the tree
     * @param groupId: group id of the group
     * @param identityCommitment: New identity commitment
     * @param proofSiblings: Array of the sibling nodes of the proof of membership.
     * @param proofPathIndices: Path of the proof of membership.
     */
    function _removeMember(
        uint256 groupId,
        uint256 identityCommitment,
        uint256[] calldata proofSiblings,
        uint8[] calldata proofPathIndices
    ) internal virtual {
        _remove(groupId, identityCommitment, proofSiblings, proofPathIndices);

        uint256 root = _getRoot(groupId);

        emit MemberRemoved(groupId, identityCommitment, root);
    }

    /**
     * @notice initializes a tree
     * @param groupId:  group id of the group
     * @param depth: depth of the tree
     * @param zero: zero value to be used
     */
    function _init(
        uint256 groupId,
        uint8 depth,
        uint256 zero
    ) internal virtual {
        SemaphoreGroupsBaseStorage.layout().setDepth(groupId, depth);

        for (uint8 i = 0; i < depth; i++) {
            SemaphoreGroupsBaseStorage.layout().setZeroes(groupId, i, zero);
            zero = PoseidonT3.poseidon([zero, zero]);
        }

        SemaphoreGroupsBaseStorage.layout().setRoot(groupId, zero);
    }

    /**
     * @notice inserts a leaf in the tree
     * @param groupId:  group id of the group
     * @param leaf: Leaf to be inserted
     */
    function _insert(uint256 groupId, uint256 leaf) internal virtual {
        require(
            leaf < SNARK_SCALAR_FIELD,
            "IncrementalBinaryTree: leaf must be < SNARK_SCALAR_FIELD"
        );
        require(
            _getNumberOfLeaves(groupId) < 2**_getDepth(groupId),
            "IncrementalBinaryTree: tree is full"
        );

        uint256 index = _getNumberOfLeaves(groupId);
        uint256 hash = leaf;
        SemaphoreGroupsBaseStorage.IncrementalTreeData
            storage data = SemaphoreGroupsBaseStorage.layout().groups[groupId];

        for (uint8 i = 0; i < _getDepth(groupId); i++) {
            if (index % 2 == 0) {
                data.lastSubtrees[i] = [hash, _getZeroes(groupId, i)];
            } else {
                data.lastSubtrees[i][1] = hash;
            }

            hash = PoseidonT3.poseidon(data.lastSubtrees[i]);
            index /= 2;
        }

        SemaphoreGroupsBaseStorage.layout().setRoot(groupId, hash);
        SemaphoreGroupsBaseStorage.layout().setNumberOfLeaves(groupId);
    }

    /**
     * @notice removes a leaf from the tree
     * @param groupId:  group id of the group
     * @param leaf: leaf to be removed
     * @param proofSiblings: array of the sibling nodes of the proof of membership
     * @param proofPathIndices: path of the proof of membership
     */
    function _remove(
        uint256 groupId,
        uint256 leaf,
        uint256[] calldata proofSiblings,
        uint8[] calldata proofPathIndices
    ) internal virtual {
        require(
            _verify(groupId, leaf, proofSiblings, proofPathIndices),
            "IncrementalBinaryTree: leaf is not part of the tree"
        );

        SemaphoreGroupsBaseStorage.IncrementalTreeData
            storage data = SemaphoreGroupsBaseStorage.layout().groups[groupId];

        uint256 hash = _getZeroes(groupId, 0);

        for (uint8 i = 0; i < _getDepth(groupId); i++) {
            if (proofPathIndices[i] == 0) {
                if (proofSiblings[i] == data.lastSubtrees[i][1]) {
                    data.lastSubtrees[i][0] = hash;
                }

                hash = PoseidonT3.poseidon([hash, proofSiblings[i]]);
            } else {
                if (proofSiblings[i] == data.lastSubtrees[i][0]) {
                    data.lastSubtrees[i][1] = hash;
                }

                hash = PoseidonT3.poseidon([proofSiblings[i], hash]);
            }
        }

        SemaphoreGroupsBaseStorage.layout().setRoot(groupId, hash);
    }

    /**
     * @notice verify if the path is correct and the leaf is part of the tree
     * @param groupId:  group id of the group
     * @param leaf: leaf to be removed
     * @param proofSiblings: array of the sibling nodes of the proof of membership
     * @param proofPathIndices: path of the proof of membership
     * @return true or false
     */
    function _verify(
        uint256 groupId,
        uint256 leaf,
        uint256[] calldata proofSiblings,
        uint8[] calldata proofPathIndices
    ) internal virtual returns (bool) {
        require(
            leaf < SNARK_SCALAR_FIELD,
            "IncrementalBinaryTree: leaf must be < SNARK_SCALAR_FIELD"
        );
        require(
            proofPathIndices.length == _getDepth(groupId) &&
                proofSiblings.length == _getDepth(groupId),
            "IncrementalBinaryTree: length of path is not correct"
        );

        uint256 hash = leaf;

        for (uint8 i = 0; i < _getDepth(groupId); i++) {
            require(
                proofSiblings[i] < SNARK_SCALAR_FIELD,
                "IncrementalBinaryTree: sibling node must be < SNARK_SCALAR_FIELD"
            );

            if (proofPathIndices[i] == 0) {
                hash = PoseidonT3.poseidon([hash, proofSiblings[i]]);
            } else {
                hash = PoseidonT3.poseidon([proofSiblings[i], hash]);
            }
        }

        return hash == _getRoot(groupId);
    }

    /**
     * @notice hook that is called before createGroup
     */
    function _beforeCreateGroup(
        uint256 groupId,
        uint8 depth,
        uint256 zeroValue,
        address admin
    ) internal view virtual {
        require(
            groupId < SNARK_SCALAR_FIELD,
            "SemaphoreGroupsBaseInternal: group id must be < SNARK_SCALAR_FIELD"
        );
        require(
            _getDepth(groupId) == 0,
            "SemaphoreGroupsBaseInternal: group already exists"
        );

        require(
            zeroValue < SNARK_SCALAR_FIELD,
            "IncrementalBinaryTree: leaf must be < SNARK_SCALAR_FIELD"
        );
        require(
            depth > 0 && depth <= MAX_DEPTH,
            "IncrementalBinaryTree: tree depth must be between 1 and 32"
        );
        require(admin != address(0), "admin is the zero address");
    }

    /**
     * @notice hook that is called after createGroup
     */
    function _afterCreateGroup(
        uint256 groupId,
        uint8 depth,
        uint256 zeroValue,
        address admin
    ) internal view virtual {}

    /**
     * @notice hook that is called before addMembers
     */
    function _beforeAddMembers(
        uint256 groupId,
        uint256[] memory identityCommitments
    ) internal view virtual {}

    /**
     * @notice hook that is called after addMembers
     */
    function _afterAddMembers(
        uint256 groupId,
        uint256[] memory identityCommitments
    ) internal view virtual {}

    /**
     * @notice hook that is called before removeMember
     */
    function _beforeRemoveMembers(
        uint256 groupId,
        uint256 identityCommitment,
        uint256[] calldata proofSiblings,
        uint8[] calldata proofPathIndices
    ) internal view virtual {
        require(
            _getDepth(groupId) != 0,
            "SemaphoreGroups: group does not exist"
        );
    }

    /**
     * @notice hook that is called after removeMember
     */
    function _afterRemoveMember(
        uint256 groupId,
        uint256 identityCommitment,
        uint256[] calldata proofSiblings,
        uint8[] calldata proofPathIndices
    ) internal view virtual {}
}
