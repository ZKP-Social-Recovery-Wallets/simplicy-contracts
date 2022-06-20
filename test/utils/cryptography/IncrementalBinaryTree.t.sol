// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import {IIncrementalBinaryTreeInternal} from "../../../src/utils/cryptography/IncrementalBinaryTree/IIncrementalBinaryTreeInternal.sol";
import {IncrementalBinaryTreeMock} from "../../../src/utils/cryptography/IncrementalBinaryTree/IncrementalBinaryTree.mock.sol";
import {SNARK_SCALAR_FIELD} from "../../../src/utils/Constants.sol";

contract IncrementalBinaryTreeTest is Test, IIncrementalBinaryTreeInternal {
    IncrementalBinaryTreeMock public incrementalBinaryTreeMock;
    function setUp() public {
        incrementalBinaryTreeMock = new IncrementalBinaryTreeMock();
    }

    function testCreateTree(
        uint256 treeId,
        uint8 depth,
        uint256 zero
    ) public {
        vm.assume(depth > 1 && depth < 32);
        vm.assume(zero < SNARK_SCALAR_FIELD);
        // Check topic 1 and topic 2, data and indexed topic for the next event
        vm.expectEmit(true, true, true, true);
        // The event we expect
        emit TreeCreated(treeId, depth);
        // The event we get
        incrementalBinaryTreeMock.createTree(treeId, depth, zero);
    }

    function testInsertLeaf(
       uint256 treeId, uint256 leaf
    ) public {
        vm.assume(leaf < SNARK_SCALAR_FIELD);
        // Check topic 1 and topic 2, data and indexed topic for the next event
        vm.expectEmit(true, true, true, true);
        // The event we expect
        emit LeafInserted(treeId, leaf);
        incrementalBinaryTreeMock.insertLeaf(treeId, leaf);
    }

    // function testRemoveLeaf(
    //     uint256 treeId,
    //     uint256 leaf,
    //     uint256[] calldata proofSiblings,
    //     uint8[] calldata proofPathIndices
    // ) public { 
    //     vm.assume(leaf < SNARK_SCALAR_FIELD);
    //     uint256 depth = incrementalBinaryTreeMock.getDepth(treeId);
    //     vm.assume(proofSiblings.length == depth);
    //     vm.assume(proofPathIndices.length == depth);

    //     uint256 root = incrementalBinaryTreeMock.getRoot(treeId);
    //     // Check topic 1 and topic 2, data and indexed topic for the next event
    //     vm.expectEmit(true, true, true, true);
    //     // The event we expect
    //     emit LeafRemoved(treeId, leaf, root);
    //     incrementalBinaryTreeMock.removeLeaf(treeId, leaf, proofSiblings, proofPathIndices);
    // }
}
