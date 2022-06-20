// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {OwnableInternal} from "@solidstate/contracts/access/ownable/OwnableInternal.sol";

import {ERC721Service} from "../token/ERC721/ERC721Service.sol";
import {ERC721ServiceStorage} from "../token/ERC721/ERC721ServiceStorage.sol";

contract ERC721Facet is ERC721Service, OwnableInternal {
    using ERC721ServiceStorage for ERC721ServiceStorage.Layout;

    /**
     * @notice return the current version of ERC721Facet
     */
    function erc721FacetVersion() public pure returns (string memory) {
        return "0.0.1";
    }

    function _beforeTransferERC721(address token, address to, uint256 tokenId) internal virtual view override onlyOwner {
        super._beforeTransferERC721(token, to, tokenId);
    }

    function _beforeApproveERC721(address token, address spender, uint256 tokenId) internal virtual view override onlyOwner {
        super._beforeApproveERC721(token, spender, tokenId);
    }

    function _beforeRegisterERC721(address tokenAddress) internal virtual view override onlyOwner {
        super._beforeRegisterERC721(tokenAddress);
    }

    function _beforeRemoveERC721(address tokenAddress) internal virtual view override onlyOwner {
        super._beforeRemoveERC721(tokenAddress);
    }
}