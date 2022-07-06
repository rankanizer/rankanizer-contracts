// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.3;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "./utils/EnumerablePollsMap.sol";
import "./utils/HeapSort.sol";
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
    function submitVote(bytes32 hash, uint128 candidateIndex)
        external
        virtual
        pollMustExist(hash)
        didNotExpire(hash)
        didNotFinish(hash)
    {
        EnumerablePollsMap.Poll storage poll = _polls.get(hash);
        uint256 candidates = poll.candidates;
        require(candidateIndex < candidates, "Candidate doesn't exist.");

        Voter memory voter = _voters[hash][msg.sender];
        require(!voter.voted, "Account already voted, use changeVote instead.");

        voter.voted = true;
        voter.vote = candidateIndex;

        unchecked {
            poll.votes[candidateIndex]++;
        }

        _voters[hash][msg.sender] = voter;
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
    function changeVote(bytes32 hash, uint128 candidateIndex)
        external
        virtual
        pollMustExist(hash)
        didNotExpire(hash)
        didNotFinish(hash)
    {
        EnumerablePollsMap.Poll storage poll = _polls.get(hash);
        uint256 candidates = poll.candidates;
        require(candidateIndex < candidates, "Candidate doesn't exist.");

        // Read and decode vote from storage
        Voter memory voter = _voters[hash][msg.sender];
        require(voter.voted, "This account hasn't voted, use submitVote instead.");

        unchecked {
            poll.votes[voter.vote]--;
            poll.votes[candidateIndex]++;
        }

        voter.vote = candidateIndex;
        _voters[hash][msg.sender] = voter;
    }

    /**
     * @dev Returns the vote of `voter`
     *
     * Requirements:
     *
     * - `voter` must have voted
     * - `voter` must exist
     */
    function voteOf(bytes32 hash, address voterAddress) external view pollMustExist(hash) returns (uint256) {
        require(
            msg.sender == _polls.getUnchecked(hash).owner || msg.sender == voterAddress,
            "Only the creator or the voter may call this method."
        );

        require(_voters[hash][voterAddress].voted, "Voter must exist.");

        return _voters[hash][voterAddress].vote;
    }

    /**
     * @dev Returns if `voter` has voted
     *
     */
    function didVote(bytes32 hash, address voter) external view override pollMustExist(hash) returns (bool) {
        return _voters[hash][voter].voted;
    }

    uint256[49] private __gap;
}
