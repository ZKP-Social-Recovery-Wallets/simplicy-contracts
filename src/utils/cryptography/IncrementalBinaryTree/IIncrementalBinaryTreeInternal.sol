//SPDX-License-Identifier: MIT

pragma solidity ^0.8.14;

/**
 * @title Partial IncrementalBinaryTree interface needed by internal functions
 */
interface IIncrementalBinaryTreeInternal {
    event TreeCreated(uint256 indexed treeId, uint8 depth);
    event LeafInserted(uint256 indexed treeId, uint256 leaf);
    event LeafRemoved(uint256 indexed treeId, uint256 leaf, uint256 root);
}
