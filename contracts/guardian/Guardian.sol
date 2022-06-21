// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {IGuardian} from "./IGuardian.sol";
import {GuardianInternal} from "./GuardianInternal.sol";
import {GuardianStorage} from "./GuardianStorage.sol";

/**
 * @title Guardian functions 
 */
abstract contract Guardian is IGuardian, GuardianInternal {
    /**
     * @inheritdoc IGuardian
     */
    function getGuardian(uint256 hashId) external view override returns (GuardianStorage.Guardian memory) {
        uint index = _getGuardianIndex(hashId);
        uint arrayIndex = index - 1;
        return _getGuardian(arrayIndex);
    }

    /**
     * @inheritdoc IGuardian
     */
    function getGuardians(uint256 groupId, bool includePendingAddition) external view override returns (GuardianStorage.Guardian[] memory) {
        return _getGuardians(groupId, includePendingAddition);
    }

    /**
     * @inheritdoc IGuardian
     */
    function numGuardians(uint256 groupId, bool includePendingAddition) external view override returns (uint256) {
        return _numGuardians(groupId, includePendingAddition);
    }

    /**
     * @inheritdoc IGuardian
     */
    function setInitialGuardians(
        uint256 groupId,
        AddGuardianDTO[] calldata guardians
    ) external override {
        _beforeSetInitialGuardians(groupId, guardians);

         for (uint i = 0; i < guardians.length; i++) {
            uint256 hashId = guardians[i].hashId;
            uint256 identityCommitment = guardians[i].identityCommitment;
            uint validUntil = guardians[i].validUntil;
            require(addGuardian(groupId, identityCommitment, hashId, validUntil), "Guardian: FAILED_TO_ADD_GUARDIAN");         
        }

        _afterSetInitialGuardians(groupId, guardians);
    }

    /**
     * @inheritdoc IGuardian
     */
    function removeGuardians(
        uint256 groupId,
        RemoveGuardianDTO[] calldata guardians
    ) external override {
        _beforeRemoveGuardians(groupId, guardians);

         for (uint i = 0; i < guardians.length; i++) {
            uint256 hashId = guardians[i].hashId;
            uint256 identityCommitment = guardians[i].identityCommitment;
            uint pendingPeriod = guardians[i].pendingPeriod;
            uint256[] calldata proofSiblings = guardians[i].proofSiblings;
            uint8[] calldata proofPathIndices = guardians[i].proofPathIndices;
            require(removeGuardian(groupId, hashId, identityCommitment, pendingPeriod, proofSiblings, proofPathIndices), "Guardian: FAILED_TO_REMOVE_GUARDIAN");            
        }
        _afterRemoveGuardians(groupId, guardians);
    }

    /**
     * @inheritdoc IGuardian
     */
    function cancelPendingGuardians(
        uint256 groupId
    ) external override {
        // TODO: implement
    }

     /**
     * @inheritdoc IGuardian
     */
    function addGuardian(
        uint256 groupId,
        uint256 hashId,
        uint256 identityCommitment,
        uint256 validUntil
    ) public override returns(bool){
        _beforeAddGuardian(groupId, hashId, identityCommitment, validUntil);
        
        return _addGuardian(groupId, hashId, identityCommitment, validUntil);
    }

    /**
     * @inheritdoc IGuardian
     */
    function removeGuardian(
        uint256 groupId,
        uint256 hashId,
        uint256 identityCommitment,
        uint256 validUntil,
        uint256[] calldata proofSiblings,
        uint8[] calldata proofPathIndices
    ) public override returns(bool) {
         _beforeRemoveGuardian(groupId, hashId, identityCommitment, validUntil, proofSiblings, proofPathIndices);
        
        return _removeGuardian(groupId, hashId, identityCommitment, validUntil, proofSiblings, proofPathIndices);
    }
}
