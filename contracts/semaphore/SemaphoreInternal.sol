// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {ISemaphoreInternal} from "./ISemaphoreInternal.sol";
import {SemaphoreStorage} from "./SemaphoreStorage.sol";
import {SemaphoreGroupsBase} from "./base/SemaphoreGroupsBase.sol";

/**
 * @title Base SemaphoreGroups internal functions, excluding optional extensions
 */
abstract contract SemaphoreInternal is ISemaphoreInternal, SemaphoreGroupsBase {
    using SemaphoreStorage for SemaphoreStorage.Layout;

    function _verifyProof(
        uint256 groupId,
        bytes32 signal,
        uint256 nullifierHash,
        uint256 externalNullifier,
        uint256[8] calldata proof
    ) internal virtual {
        uint256 root = getRoot(groupId);
        uint8 depth = getDepth(groupId);

        emit ProofVerified(groupId, signal);
    }
}
