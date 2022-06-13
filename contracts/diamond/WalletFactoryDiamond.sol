// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {SolidStateDiamond} from "@solidstate/contracts/proxy/diamond/SolidStateDiamond.sol";

contract WalletFactoryDiamond is SolidStateDiamond {
    /**
     * @notice return the current version of the diamond
     */
    function version() public pure returns (string memory) {
        return "0.0.1";
    }
}
