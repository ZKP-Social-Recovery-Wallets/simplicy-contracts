// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

/**
 * @title Partial ERC173 interface needed by internal functions
 */
interface IERC173Internal {
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );
}

interface IOwnableInternal is IERC173Internal {}

library OwnableStorage {
    struct Layout {
        address owner;
    }

    bytes32 internal constant STORAGE_SLOT =
        keccak256("solidstate.contracts.storage.Ownable");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }

    function setOwner(Layout storage l, address owner) internal {
        l.owner = owner;
    }
}

abstract contract OwnableInternal is IOwnableInternal {
    using OwnableStorage for OwnableStorage.Layout;

    modifier onlyOwner() {
        require(
            msg.sender == OwnableStorage.layout().owner,
            "Ownable: sender must be owner"
        );
        _;
    }

    function _owner() internal view virtual returns (address) {
        return OwnableStorage.layout().owner;
    }

    function _transferOwnership(address account) internal virtual {
        OwnableStorage.layout().setOwner(account);
        emit OwnershipTransferred(msg.sender, account);
    }
}

/**
 * @title Partial SemaphoreGroups interface needed by internal functions
 */
interface ISemaphoreGroupsInternal {
    /**
     * @notice emitted when a new group is created
     * @param groupId: group id of the group
     * @param depth: depth of the tree
     * @param zeroValue: zero value of the tree
     */
    event GroupCreated(uint256 indexed groupId, uint8 depth, uint256 zeroValue);

    /**
     * @notice emitted when an admin is assigned to a group
     * @param groupId: Id of the group
     * @param oldAdmin: Old admin of the group
     * @param newAdmin: New admin of the group
     */
    event GroupAdminUpdated(
        uint256 indexed groupId,
        address indexed oldAdmin,
        address indexed newAdmin
    );

    /**
     * @notice emitted when a new identity commitment is added
     * @param groupId: group id of the group
     * @param identityCommitment: New identity commitment
     * @param root: New root hash of the tree
     */
    event MemberAdded(
        uint256 indexed groupId,
        uint256 identityCommitment,
        uint256 root
    );

    /**
     * @notice emitted when a new identity commitment is removed
     * @param groupId: group id of the group
     * @param identityCommitment: New identity commitment
     * @param root: New root hash of the tree
     */
    event MemberRemoved(
        uint256 indexed groupId,
        uint256 identityCommitment,
        uint256 root
    );
}

/**
 * @title SemaphoreGroups interface
 */
interface ISemaphoreGroups is ISemaphoreGroupsInternal {
    /**
     * @notice query the last root hash of a group
     * @param groupId: Id of the group
     * @return root hash of the group.
     */
    function getRoot(uint256 groupId) external view returns (uint256);

    /**
     * @notice query the depth of the tree of a group
     * @param groupId: Id of the group
     * @return depth of the group tree
     */
    function getDepth(uint256 groupId) external view returns (uint8);

    /**
     * @notice query the number of tree leaves of a group
     * @param groupId: Id of the group
     * @return number of tree leaves
     */
    function getNumberOfLeaves(uint256 groupId) external view returns (uint256);
}

/**
 * @title SemaphoreGroups base interface
 */
interface ISemaphoreGroupsBase is ISemaphoreGroups {
    /**
     * @notice ceates a new group by initializing the associated tree
     * @param groupId: Id of the group
     * @param depth: Depth of the tree
     * @param zeroValue: Zero value of the tree
     * @param admin: Admin of the grou
     */
    function createGroup(
        uint256 groupId,
        uint8 depth,
        uint256 zeroValue,
        address admin
    ) external;

    /**
     * @notice Updates the group admin
     * @param groupId: Id of the group
     * @param newAdmin: New admin of the group
     */
    function updateGroupAdmin(uint256 groupId, address newAdmin) external;

    /**
     * @notice adds an identity commitment to an existing group
     * @param groupId: Id of the group
     * @param identityCommitments: array of new identity commitments
     *
     * TODO: hash the identityCommitments to make sure users can't see
     *       which identityCommitment belongs to the guardian
     *
     */
    function addMembers(uint256 groupId, uint256[] memory identityCommitments)
        external;

    /**
     * @notice removes an identity commitment from an existing group. A proof of membership is
     *         needed to check if the node to be deleted is part of the tree
     * @param groupId: Id of the group
     * @param identityCommitment: xxisting identity commitment to be deleted
     * @param proofSiblings: Array of the sibling nodes of the proof of membership
     * @param proofPathIndices: Path of the proof of membership
     *
     * TODO: hash the identityCommitment to make sure users can't see
     *       which identityCommitment belongs to the guardian
     *
     */
    function removeMember(
        uint256 groupId,
        uint256 identityCommitment,
        uint256[] calldata proofSiblings,
        uint8[] calldata proofPathIndices
    ) external;
}

uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
uint8 constant MAX_DEPTH = 32;

library SemaphoreGroupsBaseStorage {
    struct Layout {
        mapping(uint256 => address) groupAdmins;
    }

    bytes32 internal constant STORAGE_SLOT =
        keccak256("simplicy.contracts.storage.SemaphoreGroupsBase");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }

    function setGroupAdmin(
        Layout storage s,
        uint256 groupId,
        address admin
    ) internal {
        s.groupAdmins[groupId] = admin;
    }
}

library PoseidonT3 {
    function poseidon(uint256[2] memory) public pure returns (uint256) {}
}

library PoseidonT6 {
    function poseidon(uint256[5] memory) public pure returns (uint256) {}
}

/**
 * @title Partial Semaphore interface needed by internal functions
 */
interface IIncrementalBinaryTreeInternal {
    event TreeCreated(uint256 id, uint8 depth);
    event LeafInserted(uint256 indexed treeId, uint256 leaf, uint256 root);
    event LeafRemoved(uint256 indexed treeId, uint256 leaf, uint256 root);
}

library IncrementalBinaryTreeStorage {
    struct IncrementalTreeData {
        uint8 depth;
        uint256 root;
        uint256 numberOfLeaves;
        mapping(uint256 => uint256) zeroes;
        mapping(uint256 => uint256[2]) lastSubtrees;
    }

    struct Layout {
        mapping(uint256 => IncrementalTreeData) trees;
    }

    bytes32 internal constant STORAGE_SLOT =
        keccak256("simplicy.contracts.storage.IncrementalBinaryTree");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }

    function setDepth(
        Layout storage s,
        uint256 treeId,
        uint8 depth
    ) internal {
        s.trees[treeId].depth = depth;
    }

    function setRoot(
        Layout storage s,
        uint256 treeId,
        uint256 root
    ) internal {
        s.trees[treeId].root = root;
    }

    function setNumberOfLeaves(Layout storage s, uint256 treeId) internal {
        s.trees[treeId].numberOfLeaves += 1;
    }

    function setZeroes(
        Layout storage s,
        uint256 treeId,
        uint256 leafIndex,
        uint256 zeroValue
    ) internal {
        s.trees[treeId].zeroes[leafIndex] = zeroValue;
    }
}

/**
 * @title Base SemaphoreGroups internal functions, excluding optional extensions
 */
abstract contract IncrementalBinaryTreeInternal is
    IIncrementalBinaryTreeInternal
{
    using IncrementalBinaryTreeStorage for IncrementalBinaryTreeStorage.Layout;
    using IncrementalBinaryTreeStorage for IncrementalBinaryTreeStorage.IncrementalTreeData;

    /**
     * @notice See {ISemaphoreGroups-getRoot}
     */
    function _getRoot(uint256 treeId) internal view virtual returns (uint256) {
        return IncrementalBinaryTreeStorage.layout().trees[treeId].root;
    }

    /**
     * @notice See {ISemaphoreGroups-getDepth}
     */
    function _getDepth(uint256 treeId) internal view virtual returns (uint8) {
        return IncrementalBinaryTreeStorage.layout().trees[treeId].depth;
    }

    function _getZeroes(uint256 treeId, uint256 leafIndex)
        internal
        view
        returns (uint256)
    {
        return
            IncrementalBinaryTreeStorage.layout().trees[treeId].zeroes[
                leafIndex
            ];
    }

    /**
     * @notice See {ISemaphoreGroups-getNumberOfLeaves}
     */
    function _getNumberOfLeaves(uint256 treeId)
        internal
        view
        virtual
        returns (uint256)
    {
        return
            IncrementalBinaryTreeStorage.layout().trees[treeId].numberOfLeaves;
    }

    /**
     * @notice query trees of a group
     */
    function getTreeData(uint256 treeId)
        internal
        view
        virtual
        returns (
            IncrementalBinaryTreeStorage.IncrementalTreeData storage treeData
        )
    {
        return IncrementalBinaryTreeStorage.layout().trees[treeId];
    }

    /**
     * @notice initializes a tree
     * @param treeId:  group id of the group
     * @param depth: depth of the tree
     * @param zero: zero value to be used
     */
    function _init(
        uint256 treeId,
        uint8 depth,
        uint256 zero
    ) internal virtual {
        require(
            zero < SNARK_SCALAR_FIELD,
            "IncrementalBinaryTree: leaf must be < SNARK_SCALAR_FIELD"
        );
        require(
            depth > 0 && depth <= MAX_DEPTH,
            "IncrementalBinaryTree: tree depth must be between 1 and 32"
        );

        IncrementalBinaryTreeStorage.layout().setDepth(treeId, depth);

        for (uint8 i = 0; i < depth; i++) {
            IncrementalBinaryTreeStorage.layout().setZeroes(treeId, i, zero);
            zero = PoseidonT3.poseidon([zero, zero]);
        }

        IncrementalBinaryTreeStorage.layout().setRoot(treeId, zero);
    }

    /**
     * @notice inserts a leaf in the tree
     * @param treeId:  group id of the group
     * @param leaf: Leaf to be inserted
     */
    function _insert(uint256 treeId, uint256 leaf) internal virtual {
        uint256 index = _getNumberOfLeaves(treeId);
        uint256 hash = leaf;
        IncrementalBinaryTreeStorage.IncrementalTreeData
            storage data = IncrementalBinaryTreeStorage.layout().trees[treeId];

        require(
            leaf < SNARK_SCALAR_FIELD,
            "IncrementalBinaryTree: leaf must be < SNARK_SCALAR_FIELD"
        );
        require(
            index < 2**_getDepth(treeId),
            "IncrementalBinaryTree: tree is full"
        );

        for (uint8 i = 0; i < _getDepth(treeId); i++) {
            if (index % 2 == 0) {
                data.lastSubtrees[i] = [hash, _getZeroes(treeId, i)];
            } else {
                data.lastSubtrees[i][1] = hash;
            }

            hash = PoseidonT3.poseidon(data.lastSubtrees[i]);
            index /= 2;
        }

        IncrementalBinaryTreeStorage.layout().setRoot(treeId, hash);
        IncrementalBinaryTreeStorage.layout().setNumberOfLeaves(treeId);
    }

    /**
     * @notice removes a leaf from the tree
     * @param treeId:  group id of the group
     * @param leaf: leaf to be removed
     * @param proofSiblings: array of the sibling nodes of the proof of membership
     * @param proofPathIndices: path of the proof of membership
     */
    function _remove(
        uint256 treeId,
        uint256 leaf,
        uint256[] calldata proofSiblings,
        uint8[] calldata proofPathIndices
    ) internal virtual {
        require(
            _verify(treeId, leaf, proofSiblings, proofPathIndices),
            "IncrementalBinaryTree: leaf is not part of the tree"
        );

        IncrementalBinaryTreeStorage.IncrementalTreeData
            storage data = IncrementalBinaryTreeStorage.layout().trees[treeId];

        uint256 hash = _getZeroes(treeId, 0);

        for (uint8 i = 0; i < _getDepth(treeId); i++) {
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

        IncrementalBinaryTreeStorage.layout().setRoot(treeId, hash);
    }

    /**
     * @notice verify if the path is correct and the leaf is part of the tree
     * @param leaf: leaf to be removed
     * @param proofSiblings: array of the sibling nodes of the proof of membership
     * @param proofPathIndices: path of the proof of membership
     * @return True or false.
     */
    function _verify(
        uint256 treeId,
        uint256 leaf,
        uint256[] calldata proofSiblings,
        uint8[] calldata proofPathIndices
    ) private view returns (bool) {
        require(
            leaf < SNARK_SCALAR_FIELD,
            "IncrementalBinaryTree: leaf must be < SNARK_SCALAR_FIELD"
        );
        require(
            proofPathIndices.length == _getDepth(treeId) &&
                proofSiblings.length == _getDepth(treeId),
            "IncrementalBinaryTree: length of path is not correct"
        );

        uint256 hash = leaf;

        for (uint8 i = 0; i < _getDepth(treeId); i++) {
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

        return hash == _getRoot(treeId);
    }
}

/**
 * @title Base SemaphoreGroups internal functions, excluding optional extensions
 */
abstract contract SemaphoreGroupsBaseInternal is
    ISemaphoreGroupsInternal,
    IncrementalBinaryTreeInternal
{
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
        require(
            groupId < SNARK_SCALAR_FIELD,
            "SemaphoreGroups: group id must be < SNARK_SCALAR_FIELD"
        );
        require(
            _getDepth(groupId) == 0,
            "SemaphoreGroups: group already exists"
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

/**
 * @title Base SemaphoreGroups functions, excluding optional extensions
 */
abstract contract SemaphoreGroupsBase is
    ISemaphoreGroupsBase,
    SemaphoreGroupsBaseInternal
{
    using SemaphoreGroupsBaseStorage for SemaphoreGroupsBaseStorage.Layout;

    function createGroup(
        uint256 groupId,
        uint8 depth,
        uint256 zeroValue,
        address admin
    ) external override {
        _beforeCreateGroup(groupId, depth, zeroValue, admin);

        _createGroup(groupId, depth, zeroValue);

        _setGroupAdmin(groupId, admin);

        emit GroupAdminUpdated(groupId, address(0), admin);

        _afterCreateGroup(groupId, depth, zeroValue, admin);
    }

    function updateGroupAdmin(uint256 groupId, address newAdmin)
        external
        override
        onlyGroupAdmin(groupId)
    {
        _setGroupAdmin(groupId, newAdmin);

        emit GroupAdminUpdated(groupId, msg.sender, newAdmin);
    }

    function addMembers(uint256 groupId, uint256[] memory identityCommitments)
        external
        override
        onlyGroupAdmin(groupId)
    {
        _beforeAddMembers(groupId, identityCommitments);

        for (uint256 i; i < identityCommitments.length; i++) {
            _addMember(groupId, identityCommitments[i]);
        }

        _afterAddMembers(groupId, identityCommitments);
    }

    function removeMember(
        uint256 groupId,
        uint256 identityCommitment,
        uint256[] calldata proofSiblings,
        uint8[] calldata proofPathIndices
    ) external override onlyGroupAdmin(groupId) {
        _beforeRemoveMembers(
            groupId,
            identityCommitment,
            proofSiblings,
            proofPathIndices
        );

        _removeMember(
            groupId,
            identityCommitment,
            proofSiblings,
            proofPathIndices
        );

        _afterRemoveMember(
            groupId,
            identityCommitment,
            proofSiblings,
            proofPathIndices
        );
    }

    /**
     * @inheritdoc ISemaphoreGroups
     */
    function getRoot(uint256 groupId)
        public
        view
        virtual
        override
        returns (uint256)
    {
        return _getRoot(groupId);
    }

    /**
     * @inheritdoc ISemaphoreGroups
     */
    function getDepth(uint256 groupId)
        public
        view
        virtual
        override
        returns (uint8)
    {
        return _getDepth(groupId);
    }

    /**
     * @inheritdoc ISemaphoreGroups
     */
    function getNumberOfLeaves(uint256 groupId)
        public
        view
        virtual
        override
        returns (uint256)
    {
        return _getNumberOfLeaves(groupId);
    }

    function getGroupAdmin(uint256 groupId)
        public
        view
        virtual
        returns (address)
    {
        return _getGroupAdmin(groupId);
    }
}

contract SemaphoreGroupsFacet is SemaphoreGroupsBase, OwnableInternal {
    function _beforeCreateGroup(
        uint256 groupId,
        uint8 depth,
        uint256 zeroValue,
        address admin
    ) internal view virtual override onlyOwner {}
}
