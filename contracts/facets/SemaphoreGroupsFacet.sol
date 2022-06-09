// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {Modifiers} from "../libraries/LibAppStorage.sol";
import {SemaphoreGroupsBase} from "../semaphore/base/SemaphoreGroupsBase.sol";
import {SemaphoreGroupsBaseStorage} from "../semaphore/base/SemaphoreGroupsBaseStorage.sol";

contract SemaphoreGroupsFacet is SemaphoreGroupsBase, Modifiers {
    function _beforeCreateGroup(
        uint256 groupId,
        uint8 depth,
        uint256 zeroValue,
        address admin
    ) internal view virtual override onlyOwner {}
}
