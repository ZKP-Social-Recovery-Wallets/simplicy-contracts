// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

/**
 * @title Partial Recovery interface needed by internal functions
 */
interface IRecoveryInternal {
     /**
     * @notice emitted when a wallet is recoverd
     * @param newOwner: the address of the new owner
     */
    event Recovered(address newOwner);
}
