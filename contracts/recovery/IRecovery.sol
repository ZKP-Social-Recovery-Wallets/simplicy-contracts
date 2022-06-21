// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {IRecoveryInternal} from "./IRecoveryInternal.sol";

/**
 * @title Recovery interface 
 */
interface IRecovery is IRecoveryInternal {
    /**
     * @notice recover a wallet by setting a new owner,
     *          saves the nullifier hash to avoid double signaling and emits an event
     *          if the zero-knowledge proof is valid
     * @param groupId: group id of the group.
     * @param signal: semaphore signal.
     * @param nullifierHash: nullifier hash.
     * @param externalNullifier: external nullifier.
     * @param proof: zero-knowledge proof.
     * @param newOwner: new owner of the wallet.
     */
    function recover(
        int256 groupId,
        bytes32 signal,
        uint256 nullifierHash,
        uint256 externalNullifier,
        uint256[8] calldata proof,
        address newOwner
    ) external;

     /**
     * @notice accept ownership called by the nomineeOwner
     */
    function acceptRecovery() external;
}
