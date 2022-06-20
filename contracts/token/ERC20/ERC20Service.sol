// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IERC20Service} from "./IERC20Service.sol";
import {ERC20ServiceInternal} from "./ERC20ServiceInternal.sol";
import {ERC20ServiceStorage} from "./ERC20ServiceStorage.sol";

/**
 * @title ERC20Service 
 */
abstract contract ERC20Service is
    IERC20Service,
    ERC20ServiceInternal
{
    using ERC20ServiceStorage for ERC20ServiceStorage.Layout;

    function getAllTrackedERC20Tokens() external view override returns (address[] memory) {
        return _getAllTrackedERC20Tokens();
    }

    function transferERC20(address token, address to, uint256 amount) external override returns (bool) {
        _beforeTransferERC20(token, to, amount);

        return IERC20(token).transfer(to, amount);
    }

    function approveERC20(address token, address spender, uint256 amount) external override returns (bool) {
        _beforeApproveERC20(token, spender, amount);

        return IERC20(token).approve(spender, amount);
    }

    function registerERC20(address token) external override {
        _beforeRegisterERC20(token);

        _registerERC20(token);

        _afterRegisterERC20(token);
    }

    function removeERC20(address token) external override {
        _beforeRemoveERC20(token);

        _removeERC20(token);

        _afterRemoveERC20(token);
    }
}
