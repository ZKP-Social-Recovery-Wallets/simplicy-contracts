// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {IGuardianInternal} from "./IGuardianInternal.sol";
import {GuardianStorage} from "./GuardianStorage.sol";

/**
 * @title Guardian interface 
 */
interface IGuardian is IGuardianInternal {
    /**
     * @notice query a guardian.
     * @param hashId: the hashId of the guardian.
     */
    function getGuardian(uint256 hashId) external returns (GuardianStorage.Guardian memory);

    /**
     * @notice query all guardians from the storage
     * @param groupId: Id of the group.
     * @param includePendingAddition: whether to include pending addition guardians.
     */
    function getGuardians(uint256 groupId, bool includePendingAddition) external view returns (GuardianStorage.Guardian[] memory);

    /**
     * @notice query the length of the active guardians
     * @param groupId: Id of the group.
     * @param includePendingAddition: whether to include pending addition guardians
     */
    function numGuardians(uint256 groupId, bool includePendingAddition) external view returns (uint256);

    /**
     * @notice set multiple guardians to the group.
     * @param groupId: Id of the group.
     * @param guardians: guardians to be added.
     *
     * Emits multiple {GuardianAdded} event.
     */
     function setInitialGuardians(
        uint256 groupId,
        AddGuardianDTO[] calldata guardians
    ) external;

    /**
     * @notice add a new guardian to the group.
     * @param groupId: Id of the group.
     * @param hashId: the hashId of the guardian.
     * @param identityCommitment: the identity commitment of the guardian.
     * @param validUntil: the timestamp when the guardian is added.
     * @return returns a boolean value indicating whether the operation succeeded. 
     *
     * Emits a {GuardianAdded} event.
     */
     function addGuardian(
        uint256 groupId,
        uint256 hashId,
        uint256 identityCommitment,
        uint256 validUntil
    ) external returns(bool);

    /**
     * @notice remove guardian from the group.
     * @param groupId: Id of the group.
     * @param hashId: the hashId of the guardian.
      * @param identityCommitment: the identity commitment of the guardian.
     * @param validUntil: the timestamp when the guardian is removed.
     * @return returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {GuardianRemoved} event.
     */
     function removeGuardian(
        uint256 groupId,
        uint256 hashId,
        uint256 identityCommitment,
        uint256 validUntil,
        uint256[] calldata proofSiblings,
        uint8[] calldata proofPathIndices
    ) external returns(bool);

    /**
     * @notice remove multiple guardians from the group.
     * @param groupId: Id of the group.
     * @param guardians: guardians to be removed.
     *
     * Emits multiple {GuardianRemoved} event.
     */
     function removeGuardians(
        uint256 groupId,
        RemoveGuardianDTO[] calldata guardians
    ) external;


    /**
     * @notice remove all pending guardians from the group.
     * @param groupId: Id of the group.
     *
     * Emits multiple {GuardianRemoved} event.
     */
     function cancelPendingGuardians(
        uint256 groupId
    ) external;
}
