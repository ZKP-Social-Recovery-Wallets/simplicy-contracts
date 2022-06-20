// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

library ERC20ServiceStorage {
    struct Layout {
        mapping(address => uint256) erc20TokenIndex;
        address[] erc20Tokens;
    }

    bytes32 internal constant STORAGE_SLOT =
        keccak256("simplicy.contracts.storage.ERC20Service");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }

     /**
     * @notice add an ERC20 token
     * @param tokenAddress: the address of the ERC20 token
     */
    function addErc20Token(Layout storage s, address tokenAddress)
        internal {
            uint256 arrayIndex = s.erc20Tokens.length;
            uint256 index = arrayIndex + 1;
            s.erc20Tokens.push(tokenAddress);
            s.erc20TokenIndex[tokenAddress] = index;
    }

    function removeErc20Token(Layout storage s, address tokenAddress)
        internal {
            uint256 index = s.erc20TokenIndex[tokenAddress];
            uint256 arrayIndex = index - 1;
            require(arrayIndex >= 0, "ERC20Service: array out-of-bounds");
            if(arrayIndex != s.erc20Tokens.length - 1) {
                 s.erc20Tokens[arrayIndex] = s.erc20Tokens[s.erc20Tokens.length - 1];
                 s.erc20TokenIndex[s.erc20Tokens[arrayIndex]] = index;
            }
            s.erc20Tokens.pop();
            delete s.erc20TokenIndex[tokenAddress];
    }
}
