// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {LibMeta} from "../shared/libraries/LibMeta.sol";
import {LibDiamond} from "../shared/libraries/LibDiamond.sol";
import {IDiamondCut} from "../shared/interfaces/IDiamondCut.sol";
import {IERC165} from "../shared/interfaces/IERC165.sol";
import {IDiamondLoupe} from "../shared/interfaces/IDiamondLoupe.sol";
import {IERC173} from "../shared/interfaces/IERC173.sol";

contract InitDiamond {
    AppStorage internal s;

    struct Args {
        ;
    }

    function init(Args memory _args) external {
        // adding ERC165 data
        ds.supportedInterfaces[type(IERC165).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondCut).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondLoupe).interfaceId] = true;
        ds.supportedInterfaces[type(IERC173).interfaceId] = true;
    }
}
