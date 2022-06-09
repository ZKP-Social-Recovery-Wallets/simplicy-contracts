// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../../semaphore/base/SemaphoreConstants.sol";
// import "@appliedzkp/semaphore-contracts/base/SemaphoreCore.sol";
// import "@appliedzkp/semaphore-contracts/base/SemaphoreGroups.sol";
// import {IVerifier} from "@appliedzkp/semaphore-contracts/interfaces/IVerifier.sol";
import {IGuardianInternal} from "../IGuardianInternal.sol";
import {GuardianBaseStorage} from "./GuardianBaseStorage.sol";

/**
 * @title Base Guardian internal functions, excluding optional extensions
 */
abstract contract GuardianBaseInternal is IGuardianInternal {
    /**
     * @notice checks if there is a verifier for the given tree depth
     * @param depth: Depth of the tree
     */
    modifier onlySupportedDepth(uint8 depth) {
        require(
            address(GuardianBaseStorage.layout().verifiers[depth]) !=
                address(0),
            "Semaphore: tree depth is not supported"
        );
        _;
    }

    /**
     * @notice checks if the group admin is the transaction sender
     * @param groupId: Id of the group
     */
    // modifier onlyGroupAdmin(uint256 groupId) {
    //     require(
    //         GuardianBaseStorage.layout().groupAdmins[groupId] == _msgSender(),
    //         "Semaphore: caller is not the group admin"
    //     );
    //     _;
    // }

    function _getGroupAdmin(uint256 groupId) internal view returns (address) {
        return GuardianBaseStorage.layout().groupAdmins[groupId];
    }

    // function _verifyProof(
    //     uint256 groupId,
    //     bytes32 signal,
    //     uint256 nullifierHash,
    //     uint256 externalNullifier,
    //     uint256[8] calldata proof
    // ) internal virtual {
    //     uint256 root = getRoot(groupId);
    //     uint8 depth = getDepth(groupId);

    //     IVerifier verifier = GuardianBaseStorage.layout().verifiers[depth];

    //     _verifyProof(
    //         signal,
    //         root,
    //         nullifierHash,
    //         externalNullifier,
    //         proof,
    //         verifier
    //     );

    //     _saveNullifierHash(nullifierHash);

    //     emit ProofVerified(groupId, signal);
    // }

    /**
     * @notice hook that is called before createGroup
     */
    function _beforeCreateGroup(
        uint256 groupId,
        uint8 depth,
        uint256 zeroValue
    ) internal virtual {}

    /**
     * @notice hook that is called after createGroup
     */
    function _afterCreateGroup(
        uint256 groupId,
        uint8 depth,
        uint256 zeroValue
    ) internal virtual {}

    /**
     * @notice hook that is called before addMembers
     */
    function _beforeAddMembers(
        uint256 groupId,
        uint256[] memory identityCommitments
    ) internal virtual {}

    /**
     * @notice hook that is called after addMembers
     */
    function _afterAddMembers(
        uint256 groupId,
        uint256[] memory identityCommitments
    ) internal virtual {}

    /**
     * @notice hook that is called before removeMember
     */
    function _beforeRemoveMember(
        uint256 groupId,
        uint256 identityCommitment,
        uint256[] calldata proofSiblings,
        uint8[] calldata proofPathIndices
    ) internal virtual {}

    /**
     * @notice hook that is called after removeMember
     */
    function _afterRemoveMember(
        uint256 groupId,
        uint256 identityCommitment,
        uint256[] calldata proofSiblings,
        uint8[] calldata proofPathIndices
    ) internal virtual {}

    /**
     * @notice hook that is called before verifyProof
     */
    // function _beforeVerifyProof(
    //     uint256 groupId,
    //     bytes32 signal,
    //     uint256 nullifierHash,
    //     uint256 externalNullifier,
    //     uint256[8] calldata proof
    // ) internal virtual {
    //     uint8 depth = getDepth(groupId);
    //     require(depth != 0, "GuardianBase: group doesn't exist");
    //}

    /**
     * @notice hook that is called after verifyProof.
     */
    function _afterVerifyProof(
        uint256 groupId,
        bytes32 signal,
        uint256 nullifierHash,
        uint256 externalNullifier,
        uint256[8] calldata proof
    ) internal virtual {}
}
