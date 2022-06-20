// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

library ERC1155ServiceStorage {
    struct Layout {
        mapping(address => uint256) erc1155TokenIndex;
        address[] erc1155Tokens;
    }

    bytes32 internal constant STORAGE_SLOT =
        keccak256("simplicy.contracts.storage.ERC1155Service");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }

     /**
     * @notice add an ERC1155 token
     * @param tokenAddress: the address of the ERC1155 token
     */
    function addErc1155Token(Layout storage s, address tokenAddress)
        internal {
            uint256 arrayIndex = s.erc1155Tokens.length;
            uint256 index = arrayIndex + 1;
            s.erc1155Tokens.push(tokenAddress);
            s.erc1155TokenIndex[tokenAddress] = index;
    }

    function removeErc1155Token(Layout storage s, address tokenAddress)
        internal {
            uint256 index = s.erc1155TokenIndex[tokenAddress];
            uint256 arrayIndex = index - 1;
            require(arrayIndex >= 0, "ERC1155Service: array out-of-bounds");
            if(arrayIndex != s.erc1155Tokens.length - 1) {
                 s.erc1155Tokens[arrayIndex] = s.erc1155Tokens[s.erc1155Tokens.length - 1];
                 s.erc1155TokenIndex[s.erc1155Tokens[arrayIndex]] = index;
            }
            s.erc1155Tokens.pop();
            delete s.erc1155TokenIndex[tokenAddress];
    }
}
