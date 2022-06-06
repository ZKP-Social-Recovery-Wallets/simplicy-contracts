// SPDX-License-Identifier: MIT
pragma solidity >=0.8.1 <0.9.0;

library WalletBaseStorage {
    struct Layout {
        ;
    }

    bytes32 internal constant STORAGE_SLOT =
        keccak256("simplicy.contracts.storage.WalletBase");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
