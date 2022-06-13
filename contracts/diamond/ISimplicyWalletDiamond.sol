//SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

/**
 * @title Partial Semaphore interface needed by internal functions
 */
interface ISimplicyWalletDiamond {
    function version() external view returns (string memory);

    function changeOwner(address _owner) external;
}
