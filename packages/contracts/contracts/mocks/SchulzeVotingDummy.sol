// SPDX-License-Identifier: GLP-3.0

pragma solidity ^0.8.3;

import "../SchulzeVoting.sol";

contract SchulzeVotingDummy is SchulzeVoting {
    function dummy() public pure returns (uint) {
        return 0xdeadbeef;
    }

    uint256[50] private __gap;
}
