// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {OwnableStorage} from "@solidstate/contracts/access/ownable/Ownable.sol";

import {SolidStateDiamond} from "@solidstate/contracts/proxy/diamond/SolidStateDiamond.sol";
import {ISimplicyWalletDiamond} from "./ISimplicyWalletDiamond.sol";
import {Semaphore} from "../semaphore/Semaphore.sol";

contract SimplicyWalletDiamond is ISimplicyWalletDiamond, SolidStateDiamond {
    using OwnableStorage for OwnableStorage.Layout;

    function changeOwner(address owner_)
        external
        override(ISimplicyWalletDiamond)
        onlyOwner
    {
        OwnableStorage.layout().setOwner(owner_);
    }

    /**
     * @notice return the current version of the diamond
     */
    function version()
        public
        pure
        override(ISimplicyWalletDiamond)
        returns (string memory)
    {
        return "0.0.1";
    }
}
