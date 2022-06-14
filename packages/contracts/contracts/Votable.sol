// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.3;

/**
 * @dev Interface for the voting systems
 */
interface Votable {
    struct Voter {
        bool voted;
        uint256[] vote;
    }

    struct Group {
        uint256 place;
        uint256[] candidates;
    }

    event PollClosed(uint256 pollId, uint256[] winners);

    function closePoll(uint256 pollId) external;

    function vote(uint256 pollId, uint256[] memory ranking) external;

    function candidatesList(uint256 pollId) external view returns (string[] memory);

    function votesOf(uint256 pollId, uint256 candidateIndex) external view returns (uint256);

    function voteOf(uint256 pollId, address voter) external view returns (uint256[] memory);

    function didVote(uint256 pollId, address voter) external view returns (bool);

    function votes(uint256 pollId) external view returns (uint256[] memory);

    function winners(uint256 pollId) external view returns (uint256[] memory);

    function expire(uint256 pollId) external view returns (uint256);

    function finished(uint256 pollId) external view returns (bool);
}
