// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {SafeOwnableInternal} from "@solidstate/contracts/access/ownable/SafeOwnableInternal.sol";
import {IRecoveryInternal} from "./IRecoveryInternal.sol";
import {SemaphoreInternal} from "../semaphore/SemaphoreInternal.sol";

/**
 * @title Base SemaphoreGroups internal functions, excluding optional extensions
 */
abstract contract RecoveryInternal is IRecoveryInternal, SemaphoreInternal, SafeOwnableInternal {
    /**
     * @notice internal functio recover a wallet by setting a new owner,
     * @param groupId: group id of the group.
     * @param signal: semaphore signal.
     * @param nullifierHash: nullifier hash.
     * @param externalNullifier: external nullifier.
     * @param proof: zero-knowledge proof.
     * @param newOwner: new owner of the wallet.
     */
    function _recover(
        uint256 groupId,
        bytes32 signal,
        uint256 nullifierHash,
        uint256 externalNullifier,
        uint256[8] calldata proof,
        address newOwner
    )  internal virtual {
        require(_owner() != newOwner, "Recovery: IS_SAME_OWNER");
        require(msg.sender != newOwner, "Recovery: NOT_ALLOWED_TO_RECOVER_OWN_WALLET");
        SemaphoreInternal._verifyProof(groupId, signal, nullifierHash, externalNullifier, proof);

        // TODO: check majority of the guardian before accepting the recovery
        _transferOwnership(newOwner);
    }

    /**
     * @notice accept ownership called by the nomineeOwner
     */
    function _acceptRecovery() internal virtual {
        // TODO: should we change the groupAdmin?
        _acceptOwnership();
        emit Recovered(msg.sender);
    }
}
