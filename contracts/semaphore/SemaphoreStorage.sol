// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

library SemaphoreStorage {
    struct Verifier {
        address contractAddress;
        uint8 merkleTreeDepth;
    }

    struct Layout {
        mapping(uint8 => Verifier) verifiers;
    }

    bytes32 internal constant STORAGE_SLOT =
        keccak256("simplicy.contracts.storage.Semaphore");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }

    function setVerifierAddress(
        Layout storage s,
        uint8 index,
        address verifierContractAddress
    ) internal {
        s.verifiers[index].contractAddress = verifierContractAddress;
    }

    function setVerifierMerkleTreeDepth(
        Layout storage s,
        uint8 index,
        uint8 verifierMerkleTreeDepth
    ) internal {
        s.verifiers[index].merkleTreeDepth = verifierMerkleTreeDepth;
    }
}
