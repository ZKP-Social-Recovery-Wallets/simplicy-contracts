// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {ISemaphoreGroupsInternal} from "./ISemaphoreGroupsInternal.sol";

/**
 * @title SemaphoreGroups base interface
 */
interface ISemaphoreGroupsBase is ISemaphoreGroupsInternal {
    /**
     * @notice ceates a new group by initializing the associated tree
     * @param groupId: Id of the group
     * @param depth: Depth of the tree
     * @param zeroValue: Zero value of the tree
     * @param admin: Admin of the grou
     */
    function createGroup(
        uint256 groupId,
        uint8 depth,
        uint256 zeroValue,
        address admin
    ) external;

    /**
     * @notice Updates the group admin
     * @param groupId: Id of the group
     * @param newAdmin: New admin of the group
     */
    function updateGroupAdmin(uint256 groupId, address newAdmin) external;

    /**
     * @notice adds an identity commitment to an existing group
     * @param groupId: Id of the group
     * @param identityCommitments: array of new identity commitments
     *
     * TODO: hash the identityCommitments to make sure users can't see
     *       which identityCommitment belongs to the guardian
     *
     */
    function addMembers(uint256 groupId, uint256[] memory identityCommitments)
        external;

    /**
     * @notice removes an identity commitment from an existing group. A proof of membership is
     *         needed to check if the node to be deleted is part of the tree
     * @param groupId: Id of the group
     * @param identityCommitment: xxisting identity commitment to be deleted
     * @param proofSiblings: Array of the sibling nodes of the proof of membership
     * @param proofPathIndices: Path of the proof of membership
     *
     * TODO: hash the identityCommitment to make sure users can't see
     *       which identityCommitment belongs to the guardian
     *
     */
    function removeMember(
        uint256 groupId,
        uint256 identityCommitment,
        uint256[] calldata proofSiblings,
        uint8[] calldata proofPathIndices
    ) external;
}
