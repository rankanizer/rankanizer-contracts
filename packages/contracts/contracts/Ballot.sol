// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.3;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "./utils/EnumerableVotersMap.sol";
import "./utils/EnumerableGroupsMap.sol";
import "./utils/QuickSort.sol";
import "./Votable.sol";

/**
 * @dev Traditional voting system
 */
contract Ballot is Votable, Initializable, OwnableUpgradeable {
    using AddressUpgradeable for address;
    using EnumerableVotersMap for EnumerableVotersMap.Map;
    using EnumerableGroupsMap for EnumerableGroupsMap.Map;
    using EnumerableVotersMap for EnumerableVotersMap.Voter;
    using EnumerableGroupsMap for EnumerableGroupsMap.Group;

    struct Poll {
        uint256 _pollId;
        string[] _candidates;
        uint256[] _votes;
        // Expiration block
        uint256 _expire;
        // Poll closed
        bool _finished;
        // Polll Creator's address
        address creator;
    }

    mapping(uint256 => EnumerableVotersMap.Map) _voters;
    //mapping(uint256 => EnumerableGroupsMap.Map) _winners;
    uint256[][10] _winners;

    Poll[] internal _polls;

    function initialize() external virtual initializer {
        __Ballot_init();
    }

    // solhint-disable-next-line func-name-mixedcase
    function __Ballot_init() internal {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __Ballot_init_unchained();
    }

    // solhint-disable-next-line func-name-mixedcase
    function __Ballot_init_unchained() internal {}

    function createPoll(string[] memory candidates, uint256 newDuration) public virtual returns (uint256) {
        require(candidates.length > 1, "The list of candidates should have at least two elements");
        require(newDuration > 0, "The duration of the poll must be greater than zero");

        Poll memory newPoll;

        newPoll._pollId = _polls.length;
        newPoll._candidates = candidates;
        newPoll._expire = block.number + newDuration;

        newPoll._votes = new uint256[](newPoll._candidates.length);
        newPoll._finished = false;
        newPoll.creator = msg.sender;

        _polls.push(newPoll);

        return newPoll._pollId;
    }

    /**
     * @dev checks if it's the creator of the poll.
     */
    modifier pollCreatorOnly(uint256 pollId) {
        require(msg.sender == _polls[pollId].creator, "This method should be called only by the poll's creator.");
        _;
    }

    /**
     * @dev checks if poll exist.
     */
    modifier pollMustExist(uint256 pollId) {
        require(pollId < _polls.length, "Invalid poll id. This poll doesn't exist.");
        _;
    }

    /**
     * @dev checks if poll is still open. If expired, close the poll afterwards.
     */
    modifier didNotExpire(uint256 pollId) {
        require(_polls[pollId]._expire >= block.number, "This poll is closed. No more votes allowed");
        _;
        if (_polls[pollId]._expire == block.number) {
            _closePoll(pollId);
        }
    }

    /**
     * @dev checks if poll didn't expire.
     */
    modifier didExpire(uint256 pollId) {
        require(_polls[pollId]._expire <= block.number, "This poll is not closed yet.");
        _;
    }

    /**
     * @dev Register the `ranking` of the account
     *
     * Requirements:
     *
     * - `ranking` must have only one elemnent.
     * - the voted candidate must exist.
     *
     */
    function vote(uint256 pollId, uint256[] memory ranking) external virtual override didNotExpire(pollId) {
        require(ranking.length == 1, "Voting must be for only one candidate.");
        uint256 candidateIndex = ranking[0];
        require(candidateIndex < _polls[pollId]._candidates.length, "Candidate doesn't exist.");

        EnumerableVotersMap.Voter storage voter = _voters[pollId].getUnchecked(msg.sender);

        if (!voter.voted) {
            unchecked {
                _polls[pollId]._votes[candidateIndex]++;
                voter.voted = true;
            }
        } else {
            unchecked {
                _polls[pollId]._votes[voter.vote[0]]--;
                _polls[pollId]._votes[candidateIndex]++;
            }
        }
        voter.vote = [candidateIndex];
        EnumerableVotersMap.set(_voters[pollId], msg.sender, voter);
    }

    /**
     * @dev Closes the poll for voting
     *
     * Emits a {PollClosed} event.
     */
    function closePoll(uint256 pollId) public virtual override pollMustExist(pollId) pollCreatorOnly(pollId) {
        _closePoll(pollId);
    }

    /**
     * @dev Closes the poll for voting, must only be called internally
     *
     * Emits a {PollClosed} event.
     */
    function _closePoll(uint256 pollId) internal pollMustExist(pollId) {
        require(!_polls[pollId]._finished, "This poll is closed already");
        _polls[pollId]._finished = true;
        _calculateWinners(pollId);
        emit PollClosed(pollId, _winners[pollId]);
    }

    /**
     * @dev Calculates `_winners` and returns true if succesful.
     *
     */
    function _calculateWinners(uint256 pollId)
        internal
        virtual
        pollMustExist(pollId)
        returns (bool)
    {
        if (_numberOfVotes(pollId) == 0) return false;

        uint256[] memory ref = new uint256[](_polls[pollId]._votes.length);
        QuickSort.sortRef(_polls[pollId]._votes, ref);

        uint256 winnerVotes = _polls[pollId]._votes[ref[0]];

        // Temporary memory array to avoid the use of a storage variable
        uint256[] memory temp = new uint256[](_polls[pollId]._candidates.length);
        uint256 size = 0;

        for (uint256 i = 0; i < ref.length; i++) {
            if (_polls[pollId]._votes[ref[i]] == winnerVotes) {
                temp[size++] = ref[i];
            } else break;
        }

        // Updates the _winners array
        // EnumerableGroupsMap.Group storage group = _winners[pollId].getUnchecked(msg.sender);
        // group.place = 1;
        // group.candidates = new uint256[](size);
        // for (uint256 i = 0; i < size; i++) {
        //     group.candidates[i] = temp[i];
        // }

        // EnumerableGroupsMap.set(_winners[pollId], msg.sender, group);

        for (uint256 i = 0; i < size; i++) {
            _winners[pollId].push(temp[i]);
        }

        return true;
    }

    /**
     * @dev Calculates and returns the number of votes casted
     */
    function _numberOfVotes(uint256 pollId) internal view pollMustExist(pollId) returns (uint256) {
        uint256 qty = 0;
        for (uint256 i = 0; i < _polls[pollId]._votes.length; i++) {
            qty += _polls[pollId]._votes[i];
        }

        return qty;
    }

    /**
     * @dev Returns all candidates
     */
    function candidatesList(uint256 pollId) external view override pollMustExist(pollId) returns (string[] memory) {
        return _polls[pollId]._candidates;
    }

    /**
     * @dev Returns the votes of `candidateIndex`
     *
     * Requirements:
     *
     * - `candidateIndex must be a valid candidate
     *
     */
    function votesOf(uint256 pollId, uint256 candidateIndex)
        external
        view
        override
        pollMustExist(pollId)
        pollCreatorOnly(pollId)
        returns (uint256)
    {
        require(candidateIndex < _polls[pollId]._candidates.length, "Candidate doesn't exist.");
        return _polls[pollId]._votes[candidateIndex];
    }

    /**
     * @dev Returns the vote of `voter`
     *
     * Requirements:
     *
     * - `voter` must have voted
     * - `voter` must exist
     */
    function voteOf(uint256 pollId, address voter)
        external
        view
        override
        pollMustExist(pollId)
        returns (uint256[] memory)
    {
        require(
            msg.sender == _polls[pollId].creator || msg.sender == voter,
            "Only the creator or the voter may call this method"
        );
        require(EnumerableVotersMap.contains(_voters[pollId], voter), "Voter must exist.");
        require(EnumerableVotersMap.get(_voters[pollId], voter).voted, "Voter did not vote.");
        return EnumerableVotersMap.get(_voters[pollId], voter).vote;
    }

    /**
     * @dev Returns if `voter` has voted
     *
     */
    function didVote(uint256 pollId, address voter) external view override pollMustExist(pollId) returns (bool) {
        if (!EnumerableVotersMap.contains(_voters[pollId], voter)) return false;
        return EnumerableVotersMap.get(_voters[pollId], voter).voted;
    }

    /**
     * @dev Returns the votes of all candidates
     */
    function votes(uint256 pollId)
        external
        view
        override
        pollMustExist(pollId)
        pollCreatorOnly(pollId)
        returns (uint256[] memory)
    {
        return _polls[pollId]._votes;
    }

    /**
     * @dev Returns the list of winners
     */
    function winners(uint256 pollId)
        external
        view
        override
        pollMustExist(pollId)
        didExpire(pollId)
        returns (uint256[] memory)
    {
        return _winners[pollId];
    }

    /**
     * @dev Returns the expiration block
     */
    function expire(uint256 pollId) external view override pollMustExist(pollId) returns (uint256) {
        return _polls[pollId]._expire;
    }

    /**
     * @dev Returns the status of the poll
     */
    function finished(uint256 pollId) external view override pollMustExist(pollId) returns (bool) {
        return _polls[pollId]._finished;
    }

    /**
     * @dev Returns polls
     */
    function polls() external view returns (Poll[] memory) {
        return _polls;
    }

    uint256[47] private __gap;
}
