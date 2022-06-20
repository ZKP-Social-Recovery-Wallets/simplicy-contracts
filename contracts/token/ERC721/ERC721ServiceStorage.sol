// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

library ERC721ServiceStorage {
    struct Layout {
        mapping(address => uint256) erc721TokenIndex;
        address[] erc721Tokens;
    }

    bytes32 internal constant STORAGE_SLOT =
        keccak256("simplicy.contracts.storage.ERC721Service");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }

    /**
     * @notice add an ERC721 token
     * @param tokenAddress: the address of the ERC721 token
     */
    function addErc721Token(Layout storage s, address tokenAddress)
        internal {
            uint256 arrayIndex = s.erc721Tokens.length;
            uint256 index = arrayIndex + 1;
            s.erc721Tokens.push(tokenAddress);
            s.erc721TokenIndex[tokenAddress] = index;
    }

    /**
     * @notice remove an ERC721 token
     * @param tokenAddress: the address of the ERC20 token
     */
    function removeErc721Token(Layout storage s, address tokenAddress)
        internal {
            uint256 index = s.erc721TokenIndex[tokenAddress];
            uint256 arrayIndex = index - 1;
            require(arrayIndex >= 0, "ERC721Service: array out-of-bounds");
            if(arrayIndex != s.erc721Tokens.length - 1) {
                 s.erc721Tokens[arrayIndex] = s.erc721Tokens[s.erc721Tokens.length - 1];
                 s.erc721TokenIndex[s.erc721Tokens[arrayIndex]] = index;
            }
            s.erc721Tokens.pop();
            delete s.erc721TokenIndex[tokenAddress];
    }
}
