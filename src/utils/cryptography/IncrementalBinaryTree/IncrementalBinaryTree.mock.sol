// SPDX-License-Identifier: MIT

pragma solidity ^0.8.14;

import {IIncrementalBinaryTree} from "./IIncrementalBinaryTree.sol";
import {IncrementalBinaryTreeInternal} from "./IncrementalBinaryTreeInternal.sol";

contract IncrementalBinaryTreeMock is IIncrementalBinaryTree, IncrementalBinaryTreeInternal {

    function createTree(
        uint256 treeId,
        uint8 depth,
        uint256 zero
    ) external {
        _init(treeId, depth, zero);

        emit TreeCreated(treeId, depth);
    }

    function insertLeaf(uint256 treeId, uint256 leaf) external {
        _insert(treeId, leaf);

        emit LeafInserted(treeId, leaf, _getRoot(treeId));
    }

    function removeLeaf(
        uint256 treeId,
        uint256 leaf,
        uint256[] calldata proofSiblings,
        uint8[] calldata proofPathIndices
    ) external {
        _remove(treeId, leaf, proofSiblings, proofPathIndices);

        emit LeafRemoved(treeId, leaf, _getRoot(treeId));
    }
}