// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.3;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "./utils/EnumerablePollsMap.sol";
import "./utils/QuickSort.sol";
import "./Ballot.sol";

/**
 * @dev Traditional voting system
 */
contract SingleVoting is Ballot {
    using AddressUpgradeable for address;
    using EnumerablePollsMap for EnumerablePollsMap.Map;
    using EnumerablePollsMap for EnumerablePollsMap.Poll;

    struct Voter {
        bool voted;
        uint128 vote;
    }

    mapping(bytes32 => mapping(address => Voter)) private _voters;

    function initialize() external virtual initializer {
        __SingleVoting_init();
    }

    // solhint-disable-next-line func-name-mixedcase
    function __SingleVoting_init() internal {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __Ballot_init_unchained();
        __SingleVoting_init_unchained();
    }

    // solhint-disable-next-line func-name-mixedcase
    function __SingleVoting_init_unchained() internal {}

    /**
     * @dev Register the vote `candidateIndex` of the account
     *
     * Requirements:
     *
     * - the voted candidate must exist.
     * - the voter must haven't vote yet.
     *
     */
    function vote(bytes32 pollHash, uint128 candidateIndex)
        external
        virtual
        pollMustExist(pollHash)
        didNotExpire(pollHash)
    {
        EnumerablePollsMap.Poll storage poll = _polls.get(pollHash);
        uint256 candidates = poll.candidates;
        require(candidateIndex < candidates, "Candidate doesn't exist.");

        Voter memory voter = _voters[pollHash][msg.sender];
        require(!voter.voted, "Account already voted, use changeVote instead");

        voter.voted = true;
        voter.vote = candidateIndex;

        unchecked {
            poll.votes[candidateIndex]++;
        }

        _voters[pollHash][msg.sender] = voter;
    }

    /**
     * @dev Change the vote `candidateIndex` of the account
     *
     * Requirements:
     *
     * - the voted candidate must exist.
     * - the voter must have voted before.
     *
     */
    function changeVote(bytes32 pollHash, uint128 candidateIndex)
        external
        virtual
        pollMustExist(pollHash)
        didNotExpire(pollHash)
    {
        EnumerablePollsMap.Poll storage poll = _polls.get(pollHash);
        uint256 candidates = poll.candidates;
        require(candidateIndex < candidates, "Candidate doesn't exist.");

        // Read and decode vote from storage
        Voter memory voter = _voters[pollHash][msg.sender];
        require(voter.voted, "This account hasn't voted, use submitVote instead");

        unchecked {
            poll.votes[voter.vote]--;
            poll.votes[candidateIndex]++;
        }

        voter.vote = candidateIndex;
        _voters[pollHash][msg.sender] = voter;
    }

    /**
     * @dev Returns the vote of `voter`
     *
     * Requirements:
     *
     * - `voter` must have voted
     * - `voter` must exist
     */
    function voteOf(bytes32 pollHash, address voterAddress) external view pollMustExist(pollHash) returns (uint256) {
        require(
            msg.sender == _polls.getUnchecked(pollHash).owner || msg.sender == voterAddress,
            "Only the creator or the voter may call this method."
        );

        require(_voters[pollHash][voterAddress].voted, "Voter must exist.");

        return _voters[pollHash][voterAddress].vote;
    }

    /**
     * @dev Returns if `voter` has voted
     *
     */
    function didVote(bytes32 pollHash, address voter) external view override pollMustExist(pollHash) returns (bool) {
        return _voters[pollHash][voter].voted;
    }

    uint256[49] private __gap;
}
