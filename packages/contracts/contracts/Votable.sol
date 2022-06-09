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

    event PollClosed(Group[] winners);

    function closePoll() external;

    function vote(uint256[] memory ranking) external;

    function candidatesList() external view returns (string[] memory);

    function votesOf(uint256 candidateIndex) external view returns (uint256);

    function voteOf(address voter) external view returns (uint256[] memory);

    function didVote(address voter) external view returns (bool);

    function votes() external view returns (uint256[] memory);

    function winners() external view returns (Group[] memory);

    function expire() external view returns (uint256);

    function finished() external view returns (bool);
}
