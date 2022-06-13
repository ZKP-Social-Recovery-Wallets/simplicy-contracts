// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {SemaphoreInternal} from "../semaphore/SemaphoreInternal.sol";

contract GuardianFacet is SemaphoreInternal{
    function recover(uint256 groupId,
        bytes32 signal,
        uint256 nullifierHash,
        uint256 externalNullifier,
        uint256[8] calldata proof) external {
        
    }
}