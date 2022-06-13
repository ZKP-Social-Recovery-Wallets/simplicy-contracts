// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {SemaphoreVoting} from "../semaphore/extensions/SemaphoreVoting/SemaphoreVoting.sol";
import {SemaphoreVotingStorage} from "../semaphore/extensions/SemaphoreVoting/SemaphoreVotingStorage.sol";

contract SemaphoreVotingFacet is SemaphoreVoting {
    using SemaphoreVotingStorage for SemaphoreVotingStorage.Layout;

    /**
     * @notice return the current version of SemaphoreVotingFacet
     */
    function semaphoreVotingFacetVersion() public pure returns (string memory) {
        return "0.0.1";
    }
}
