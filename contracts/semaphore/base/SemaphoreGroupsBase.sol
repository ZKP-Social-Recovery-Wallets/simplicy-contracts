// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {ISemaphoreGroups} from "./ISemaphoreGroups.sol";
import {ISemaphoreGroupsBase} from "./ISemaphoreGroupsBase.sol";
import {SemaphoreGroupsBaseInternal} from "./SemaphoreGroupsBaseInternal.sol";
import {SemaphoreGroupsBaseStorage} from "./SemaphoreGroupsBaseStorage.sol";

/**
 * @title Base SemaphoreGroups functions, excluding optional extensions
 */
abstract contract SemaphoreGroupsBase is
    ISemaphoreGroupsBase,
    SemaphoreGroupsBaseInternal
{
    using SemaphoreGroupsBaseStorage for SemaphoreGroupsBaseStorage.Layout;

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

    function createGroup(
        uint256 groupId,
        uint8 depth,
        uint256 zeroValue,
        address admin
    ) public override {
        _beforeCreateGroup(groupId, depth, zeroValue, admin);

        _createGroup(groupId, depth, zeroValue);

        _setGroupAdmin(groupId, admin);

        emit GroupAdminUpdated(groupId, address(0), admin);

        _afterCreateGroup(groupId, depth, zeroValue, admin);
    }
}
