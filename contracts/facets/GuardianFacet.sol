// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {OwnableInternal} from "@solidstate/contracts/access/ownable/OwnableInternal.sol";
import {Guardian} from "../guardian/Guardian.sol";
import {GuardianStorage} from "../guardian/GuardianStorage.sol";

contract GuardianFacet is Guardian, OwnableInternal {
    /**
     * @notice return the current version of GuardianFacet
     */
    function guardianFacetVersion() public pure returns (string memory) {
        return "0.0.1";
    }
}