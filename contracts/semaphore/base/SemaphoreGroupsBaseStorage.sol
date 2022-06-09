// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

library SemaphoreGroupsBaseStorage {
    struct IncrementalTreeData {
        uint8 depth;
        uint256 root;
        uint256 numberOfLeaves;
        mapping(uint256 => uint256) zeroes;
        mapping(uint256 => uint256[2]) lastSubtrees;
    }

    struct Layout {
        mapping(uint256 => IncrementalTreeData) groups;
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

    function setDepth(
        Layout storage s,
        uint256 groupId,
        uint8 depth
    ) internal {
        s.groups[groupId].depth = depth;
    }

    function setRoot(
        Layout storage s,
        uint256 groupId,
        uint256 root
    ) internal {
        s.groups[groupId].root = root;
    }

    function setNumberOfLeaves(Layout storage s, uint256 groupId) internal {
        s.groups[groupId].numberOfLeaves += 1;
    }

    function setZeroes(
        Layout storage s,
        uint256 groupId,
        uint256 leafIndex,
        uint256 zeroValue
    ) internal {
        s.groups[groupId].zeroes[leafIndex] = zeroValue;
    }

    function setGroupAdmin(
        Layout storage s,
        uint256 groupId,
        address admin
    ) internal {
        s.groupAdmins[groupId] = admin;
    }
}
