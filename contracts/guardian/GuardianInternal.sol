// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {SafeCast} from "@solidstate/contracts/utils/SafeCast.sol";

import {IGuardianInternal} from "./IGuardianInternal.sol";
import {GuardianStorage} from "./GuardianStorage.sol";
import {SemaphoreGroupsBaseInternal} from "../semaphore/base/SemaphoreGroupsBase/SemaphoreGroupsBaseInternal.sol";
import {MIN_GUARDIANS, MAX_GUARDIANS} from "../utils/Constants.sol";


/**
 * @title Guardian internal functions, excluding optional extensions
 */
abstract contract GuardianInternal is IGuardianInternal, SemaphoreGroupsBaseInternal {
    using GuardianStorage for GuardianStorage.Layout;
    using SafeCast for uint;

    modifier isGuardian(uint256 hashId, bool includePendingAddition) {
        uint guardianIndex = _getGuardianIndex(hashId);
        uint arrayIndex = guardianIndex - 1;
        require(guardianIndex > 0, "Guardian: GUARDIAN_NOT_FOUND");

        GuardianStorage.Guardian memory g = _getGuardian(arrayIndex);
        require(_isActiveOrPendingAddition(g, includePendingAddition), "Guardian: GUARDIAN_NOT_ACTIVE");
        _;
    }

    modifier isMinGuardian(AddGuardianDTO[] calldata guardians) {
        require(guardians.length >= MIN_GUARDIANS, "Guardian: MIN_GUARDIANS_NOT_MET");
        _;
    }

    modifier isMaxGuardian(AddGuardianDTO[] calldata guardians) {
        require(guardians.length <= MAX_GUARDIANS, "Guardian: MAX_GUARDIANS_EXCEEDED");
        _;
    }

    /**
     * @notice internal query the mapping index of guardian.
     * @param hashId: the hashId of the guardian.
     */
    function _getGuardianIndex(uint256 hashId) internal view virtual returns (uint) {
        return GuardianStorage.layout().guardianIndex[hashId];
    }

    /**
     * @notice internal query query a guardian.
     * @param arrayIndex: the index of Guardian array.
     */
    function _getGuardian(uint arrayIndex) internal view virtual returns (GuardianStorage.Guardian memory) {
        return GuardianStorage.layout().guardians[arrayIndex];
    }

    /**
     * @notice internal function query all guardians from the storage
     * @param groupId: Id of the group.
     */
    function _getGuardians(uint256 groupId, bool includePendingAddition) internal view virtual returns (GuardianStorage.Guardian[] memory) {
        // TODO: isScalarField require(groupId < SNARK_SCALAR_FIELD, "GROUP_ID_OUT_OF_RANGE");
        require(_getDepth(groupId) != 0, "Guardian: GROUP_ID_NOT_EXIST");

        GuardianStorage.Guardian[] memory guardians = new GuardianStorage.Guardian[](GuardianStorage.layout().guardians.length);
        uint index = 0;
        for(uint i = 0; i < GuardianStorage.layout().guardians.length; i++) {
            GuardianStorage.Guardian memory g = GuardianStorage.layout().guardians[i];
            if (_isActiveOrPendingAddition(g, includePendingAddition)) {
                guardians[index] = g;
                index++;
            }
        }
            
        return guardians;
    }

    /**
     * @notice internal function query the length of the active guardians
     * @param groupId: Id of the group.
     */
    function _numGuardians(uint256 groupId, bool includePendingAddition) internal view virtual returns (uint count) {
        GuardianStorage.Guardian[] memory guardians = _getGuardians(groupId, includePendingAddition);
        for(uint i = 0; i < guardians.length; i++) {
            GuardianStorage.Guardian memory g = guardians[i];
            if (_isActiveOrPendingAddition(g, includePendingAddition)) {
                count++;
            }
        }
    }

    /**
     * @notice internal function add a new guardian to the group.
     * @param groupId: Id of the group.
     * @param hashId: the hashId of the guardian.
     * @param identityCommitment: the identity commitment of the guardian.
     * @param pendingPeriod: the pendingPeriod before a guardian is added.
     * @return returns a boolean value indicating whether the operation succeeded. 
     *
     * Emits a {GuardianAdded} event.
     */
     function _addGuardian(
        uint256 groupId,
        uint256 hashId,
        uint256 identityCommitment,
        uint    pendingPeriod
    ) internal virtual returns(bool) {
        uint numGuardians = _numGuardians(groupId, true);
        require(numGuardians < MAX_GUARDIANS, "Guardian: TOO_MANY_GUARDIANS");

        uint validSince = block.timestamp;
        if (numGuardians >= MIN_GUARDIANS) {
            validSince = block.timestamp + pendingPeriod;
        }
        
        bool returned = GuardianStorage.layout().storeGuardian(hashId,validSince);

        require(returned, "Guardian: FAILED_TO_ADD_GUARDIAN");

        emit GuardianAdded(hashId, validSince);

        _addMember(groupId, identityCommitment);

        return returned;
    }

     /**
     * @notice internal function remove guardian from the group.
     * @param groupId: Id of the group.
     * @param hashId: the hashId of the guardian.
     * @param identityCommitment: the identityCommitment of the guardian.
     * @param pendingPeriod: the pendingPeriod when the guardian is removed.
      * @param proofSiblings: Array of the sibling nodes of the proof of membership.
     * @param proofPathIndices: Path of the proof of membership.
     * @return returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {GuardianRemoved} event.
     */
    function _removeGuardian(
        uint256 groupId,
        uint256 hashId,
        uint256 identityCommitment,
        uint    pendingPeriod,
        uint256[] calldata proofSiblings,
        uint8[] calldata proofPathIndices
    ) internal virtual returns(bool) {
        uint validUntil = block.timestamp + pendingPeriod;
        uint index = _getGuardianIndex(hashId);
        uint arrayIndex = index - 1;

        GuardianStorage.Guardian memory g = GuardianStorage.layout().guardians[arrayIndex];

        validUntil = _deleteGuardian(g, validUntil);
        _removeMember(groupId, identityCommitment, proofSiblings, proofPathIndices);
        

        emit GuardianRemoved(hashId, validUntil);

        return true;
    }

    function _requireMajority(uint256 groupId, uint256 hashId) internal view virtual returns (bool) {
        // Calculate total group sizes
        GuardianStorage.Guardian[] memory allGuardians = _getGuardians(groupId, false);
    }

    /**
     * @notice hook that is called before setInitialGuardians
     */
    function _beforeSetInitialGuardians(
        uint256 groupId,
        AddGuardianDTO[] calldata guardians
    ) 
        internal 
        view
        virtual 
        isScalarField(groupId)
        isMinGuardian(guardians) 
        isMaxGuardian(guardians) 
    {}

    /**
     * @notice hook that is called after setInitialGuardians
     */
    function _afterSetInitialGuardians(
        uint256 groupId,
        AddGuardianDTO[] calldata guardians
    ) internal view virtual {}

    /**
     * @notice hook that is called before addGuardian
     */
    function _beforeAddGuardian(
        uint256 groupId,
        uint256 hashId,
        uint256 identityCommitment,
        uint256 validUntil
    ) internal view virtual isScalarField(groupId) {
        uint numGuardians = _numGuardians(groupId, true);
        require(numGuardians <= MAX_GUARDIANS, "Guardian: TOO_MANY_GUARDIANS");
    }

    /**
     * @notice hook that is called before removeGuardian
     */
    function _beforeRemoveGuardian(
        uint256 groupId,
        uint256 hashId,
        uint256 identityCommitment,
        uint256 validUntil,
        uint256[] calldata proofSiblings,
        uint8[] calldata proofPathIndices
    ) 
        internal view virtual 
        isScalarField(groupId) 
        isGuardian(hashId, true)
    {}

    /**
     * @notice hook that is called before removeGuardians
     */
    function _beforeRemoveGuardians(
        uint256 groupId,
        RemoveGuardianDTO[] calldata guardians
    ) internal view virtual isScalarField(groupId) {
        require(guardians.length > 0, "Guardian: NO_GUARDIANS_TO_REMOVE");
    }

    /**
     * @notice hook that is called after removeGuardians
     */
    function _afterRemoveGuardians(
        uint256 groupId,
        RemoveGuardianDTO[] calldata guardians
    ) internal view virtual  {}


    /**
     * @notice check if the guardian is active or pending for addition
     * @param guardian: the guardian to be check.
     */
    function _isActiveOrPendingAddition(
        GuardianStorage.Guardian memory guardian,
        bool includePendingAddition
        )
        private
        view
        returns (bool)
    {
        return _isAdded(guardian) || includePendingAddition && _isPendingAddition(guardian);
    }

    /**
     * @notice check if the guardian is added
     * @param guardian: the guardian to be check.
     */
    function _isAdded(GuardianStorage.Guardian memory guardian)
        private
        view
        returns (bool)
    {
        return guardian.status == uint8(IGuardianInternal.GuardianStatus.ADD) &&
            guardian.timestamp <= block.timestamp;
    }

    /**
     * @notice check if the guardian is pending for addition
     * @param guardian: the guardian to be check.
     */
    function _isPendingAddition(GuardianStorage.Guardian memory guardian)
        private
        view
        returns (bool)
    {
        return guardian.status == uint8(IGuardianInternal.GuardianStatus.ADD) &&
            guardian.timestamp > block.timestamp;
    }

     /**
     * @notice private function delete a guardian from the storage.
     * @param g: the guardian to be deleted. 
     * @param validUntil: the timestamp when the guardian is removed.
     * @return returns validUntil. 
     */
    function _deleteGuardian(GuardianStorage.Guardian memory g, uint validUntil) private returns(uint) {
        if (_isAdded(g)) {
            g.status = uint8(IGuardianInternal.GuardianStatus.REMOVE);
            g.timestamp = validUntil.toUint64();
            require(GuardianStorage.layout().deleteGuardian(g.hashId), "Guardian: UNEXPECTED_RESULT");
            return validUntil;
        }
        if (_isPendingAddition(g)) {
            g.status = uint8(IGuardianInternal.GuardianStatus.REMOVE);
            g.timestamp = 0;
            require(GuardianStorage.layout().deleteGuardian(g.hashId), "Guardian: UNEXPECTED_RESULT");
            return 0;
        }
        return 0;
    }
}
