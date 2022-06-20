// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {ISemaphoreGroupsInternal} from "./ISemaphoreGroupsInternal.sol";
import {SemaphoreGroupsBaseStorage} from "./SemaphoreGroupsBaseStorage.sol";
import {SNARK_SCALAR_FIELD} from "../../../utils/SemaphoreConstants.sol";
import {IncrementalBinaryTreeInternal} from "../../../utils/cryptography/IncrementalBinaryTree/IncrementalBinaryTreeInternal.sol";

/**
 * @title Base SemaphoreGroups internal functions, excluding optional extensions
 */
abstract contract SemaphoreGroupsBaseInternal is ISemaphoreGroupsInternal, IncrementalBinaryTreeInternal {
    using SemaphoreGroupsBaseStorage for SemaphoreGroupsBaseStorage.Layout;    

    modifier onlyGroupAdmin(uint256 groupId) {
        require(
            _getGroupAdmin(groupId) == msg.sender,
            "SemaphoreGroup: caller is not the group admin"
        );
        _;
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
     * @notice hook that is called before createGroup
     */
    function _beforeCreateGroup(
        uint256 groupId,
        uint8 depth,
        uint256 zeroValue,
        address admin
    ) internal view virtual {
        require(groupId < SNARK_SCALAR_FIELD, "SemaphoreGroups: group id must be < SNARK_SCALAR_FIELD");
        require(
            _getDepth(groupId) == 0,
            "SemaphoreGroups: group already exists"
        );
        require(admin != address(0), "SemaphoreGroups: admin is the zero address");
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
     * @notice hook that is called before updateGroupAdmin
     */
    function _beforeUpdateGroupAdmin(uint256 groupId, address newAdmin) internal view virtual {}

    /**
     * @notice hook that is called after updateGroupAdmin
     */
    function _afterUpdateGroupAdmin(uint256 groupId, address newAdmin) internal view virtual {}

    /**
     * @notice hook that is called before addMembers
     */
    function _beforeAddMembers(
        uint256 groupId,
        uint256[] memory identityCommitments
    ) internal view virtual {
         require(
            _getDepth(groupId) != 0,
            "SemaphoreGroups: group does not exist"
        );
    }

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
    function _beforeRemoveMember(
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
