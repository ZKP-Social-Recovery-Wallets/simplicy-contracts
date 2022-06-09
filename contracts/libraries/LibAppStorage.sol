// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {LibDiamond} from "../shared/libraries/LibDiamond.sol";

struct AppStorage {
    uint256 test;
}

library LibAppStorage {
    function diamondStorage() internal pure returns (AppStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }
}

contract Modifiers {
    AppStorage internal _s;

    modifier onlyOwner() {
        LibDiamond.enforceIsContractOwner();
        _;
    }
}
