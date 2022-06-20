// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {IERC721ServiceInternal} from "./IERC721ServiceInternal.sol";

/**
 * @title ERC20Service interface 
 */
interface IERC721Service is IERC721ServiceInternal {

    function getAllTrackedERC721Tokens() external view returns (address[] memory);

    /**
     * @notice safely transfers `tokenId` token from `from` to `to`
     * @param token: the address of tracked token to move
     * @param to: the address of the recipient
     * @param tokenId: the tokenId to transfer
     */
    function transferERC721(address token, address to, uint256 tokenId) external;

    /**
     * @notice gives permission to `to` to transfer `tokenId` token to another account.
     * @param token: the address of tracked token to move
     * @param spender: the address of the spender
     * @param tokenId: the tokenId to approve
     */
    function approveERC721(address token, address spender, uint256 tokenId) external;

    /**
     * @notice register a new ERC721 token
     * @param token: the address of the ERC721 token
     */
    function registerERC721(address token) external;

    /**
     * @notice remove a new ERC721 token from ERC721Service
     * @param token: the address of the ERC721 token
     */
    function removeERC721(address token) external;
}
