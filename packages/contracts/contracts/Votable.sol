// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.3;

/**
 * @dev Interface for the voting systems
 */
interface Votable {

    struct Group {
        uint256 place;
        uint256[] candidates;
    }

    event PollClosed(bytes32 pollHash, uint256[] winners);

    event PollCreated(bytes32 indexed pollHash, address indexed owner, string uri);

    function closePoll(bytes32 pollHash) external;

    function vote(bytes32 pollHash, uint256[] memory ranking) external;

    function votesOf(bytes32 pollHash, uint256 candidateIndex) external view returns (uint256);

    function voteOf(bytes32 pollHash, address voter) external view returns (uint256[] memory);

    function didVote(bytes32 pollHash, address voter) external view returns (bool);

    function votes(bytes32 pollHash) external view returns (uint256[] memory);

    function winners(bytes32 pollHash) external view returns (uint256[] memory);

    function expire(bytes32 pollHash) external view returns (uint256);

    function finished(bytes32 pollHash) external view returns (bool);
}
