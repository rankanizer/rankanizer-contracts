// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.3;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "./utils/EnumerableVotersMap.sol";
import "./utils/EnumerablePollsMap.sol";
import "./utils/QuickSort.sol";
import "./Votable.sol";

/**
 * @dev Traditional voting system
 */
contract Ballot is Votable, Initializable, OwnableUpgradeable {
    using AddressUpgradeable for address;
    using EnumerableVotersMap for EnumerableVotersMap.Map;
    using EnumerableVotersMap for EnumerableVotersMap.Voter;
    using EnumerablePollsMap for EnumerablePollsMap.Map;
    using EnumerablePollsMap for EnumerablePollsMap.Poll;

    string private constant _POLL_TYPE = "Poll(uint256 candidates,string uri)";

    mapping(bytes32 => EnumerableVotersMap.Map) _voters;

    // TODO Issue #6 - Refactoring the code
    mapping(bytes32 => uint256[]) _winners;

    // Polls of the contract
    EnumerablePollsMap.Map internal _polls;

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

    /**
     * @dev Create a new poll and return it's unique id
     *
     * Requirements:
     *
     * - `candidates`  number of candidates, must be at least 2.
     * - `uri` uri of the candidates
     * - `newDuration` must be greater than zero.
     *
     */
    function createPoll(
        uint256 candidates,
        string memory uri,
        uint256 newDuration
    ) public virtual returns (bytes32) {
        require(candidates > 1, "The list of candidates should have at least two elements");
        require(newDuration > 0, "The duration of the poll must be greater than zero");

        EnumerablePollsMap.Poll memory newPoll = EnumerablePollsMap.Poll({
            candidates: candidates,
            votes: new uint256[](candidates),
            expire: block.number + newDuration,
            finished: false,
            creator: msg.sender,
            uri: uri
        });

        bytes32 pollHash = calcPollHash(newPoll);

        _polls.set(pollHash, newPoll);

        return pollHash;
    }

    /**
     * @dev Return the poll's hash
     *
     * Requirements:
     *
     * - `poll`  poll to calculate the hash
     *
     */
    function calcPollHash(EnumerablePollsMap.Poll memory poll) public pure returns (bytes32) {
        return keccak256(abi.encode(_POLL_TYPE, poll.candidates, keccak256(abi.encode(poll.uri))));
    }

    /**
     * @dev checks if it's the creator of the poll.
     */
    modifier pollCreatorOnly(bytes32 pollHash) {
        require(msg.sender == _polls.get(pollHash).creator, "This method should be called only by the poll's creator.");
        _;
    }

    /**
     * @dev checks if poll exist.
     */
    modifier pollMustExist(bytes32 pollHash) {
        require(_polls.contains(pollHash), "Invalid poll id. This poll doesn't exist.");
        _;
    }

    /**
     * @dev checks if poll is still open. If expired, close the poll afterwards.
     */
    modifier didNotExpire(bytes32 pollHash) {
        require(_polls.get(pollHash).expire >= block.number, "This poll is closed. No more votes allowed");
        _;
        if (_polls.get(pollHash).expire == block.number) {
            _closePoll(pollHash);
        }
    }

    /**
     * @dev checks if poll didn't expire.
     */
    modifier didExpire(bytes32 pollHash) {
        require(_polls.get(pollHash).expire <= block.number, "This poll is not closed yet.");
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
    function vote(bytes32 pollHash, uint256[] memory ranking)
        external
        virtual
        override
        pollMustExist(pollHash)
        didNotExpire(pollHash)
    {
        require(ranking.length == 1, "Voting must be for only one candidate.");
        uint256 candidateIndex = ranking[0];
        require(candidateIndex < _polls.get(pollHash).candidates, "Candidate doesn't exist.");

        EnumerableVotersMap.Voter storage voter = _voters[pollHash].getUnchecked(msg.sender);

        if (!voter.voted) {
            unchecked {
                _polls.get(pollHash).votes[candidateIndex]++;
                voter.voted = true;
            }
        } else {
            unchecked {
                _polls.get(pollHash).votes[voter.vote[0]]--;
                _polls.get(pollHash).votes[candidateIndex]++;
            }
        }
        voter.vote = [candidateIndex];
        EnumerableVotersMap.set(_voters[pollHash], msg.sender, voter);
    }

    /**
     * @dev Closes the poll for voting
     *
     * Emits a {PollClosed} event.
     */
    function closePoll(bytes32 pollHash) external virtual override pollMustExist(pollHash) pollCreatorOnly(pollHash) {
        _closePoll(pollHash);
    }

    /**
     * @dev Closes the poll for voting, must only be called internally
     *
     * Emits a {PollClosed} event.
     */
    function _closePoll(bytes32 pollHash) internal pollMustExist(pollHash) {
        require(!_polls.get(pollHash).finished, "This poll is closed already");
        _polls.get(pollHash).finished = true;
        _calculateWinners(pollHash);
        emit PollClosed(pollHash, _winners[pollHash]);
    }

    /**
     * @dev Calculates `_winners` and returns true if succesful.
     *
     */
    function _calculateWinners(bytes32 pollHash) internal virtual pollMustExist(pollHash) returns (bool) {
        if (_numberOfVotes(pollHash) == 0) return false;

        uint256[] memory ref = new uint256[](_polls.get(pollHash).votes.length);
        QuickSort.sortRef(_polls.get(pollHash).votes, ref);

        uint256 winnerVotes = _polls.get(pollHash).votes[ref[0]];

        // Temporary memory array to avoid the use of a storage variable
        uint256[] memory temp = new uint256[](_polls.get(pollHash).candidates);
        uint256 size = 0;

        for (uint256 i = 0; i < ref.length; i++) {
            if (_polls.get(pollHash).votes[ref[i]] == winnerVotes) {
                temp[size++] = ref[i];
            } else break;
        }

        for (uint256 i = 0; i < size; i++) {
            _winners[pollHash].push(temp[i]);
        }

        return true;
    }

    /**
     * @dev Calculates and returns the number of votes casted
     */
    function _numberOfVotes(bytes32 pollHash) internal view pollMustExist(pollHash) returns (uint256) {
        uint256 qty = 0;
        for (uint256 i = 0; i < _polls.get(pollHash).votes.length; i++) {
            qty += _polls.get(pollHash).votes[i];
        }

        return qty;
    }

    /**
     * @dev Returns the votes of `candidateIndex`
     *
     * Requirements:
     *
     * - `candidateIndex must be a valid candidate
     *
     */
    function votesOf(bytes32 pollHash, uint256 candidateIndex)
        external
        view
        override
        pollMustExist(pollHash)
        pollCreatorOnly(pollHash)
        returns (uint256)
    {
        require(candidateIndex < _polls.get(pollHash).candidates, "Candidate doesn't exist.");
        return _polls.get(pollHash).votes[candidateIndex];
    }

    /**
     * @dev Returns the vote of `voter`
     *
     * Requirements:
     *
     * - `voter` must have voted
     * - `voter` must exist
     */
    function voteOf(bytes32 pollHash, address voter)
        external
        view
        override
        pollMustExist(pollHash)
        returns (uint256[] memory)
    {
        require(
            msg.sender == _polls.get(pollHash).creator || msg.sender == voter,
            "Only the creator or the voter may call this method."
        );
        require(EnumerableVotersMap.contains(_voters[pollHash], voter), "Voter must exist.");
        require(EnumerableVotersMap.get(_voters[pollHash], voter).voted, "Voter did not vote.");
        return EnumerableVotersMap.get(_voters[pollHash], voter).vote;
    }

    /**
     * @dev add a `voter` to the list of `_voters`
     *
     */
    function addVoter(bytes32 pollHash, address voterAddress)
        external
        pollMustExist(pollHash)
        pollCreatorOnly(pollHash)
    {
        EnumerableVotersMap.Voter storage voter = _voters[pollHash].getUnchecked(voterAddress);
        EnumerableVotersMap.set(_voters[pollHash], voterAddress, voter);
    }

    /**
     * @dev Returns if `voter` has voted
     *
     */
    function didVote(bytes32 pollHash, address voter) external view override pollMustExist(pollHash) returns (bool) {
        if (!EnumerableVotersMap.contains(_voters[pollHash], voter)) return false;
        return EnumerableVotersMap.get(_voters[pollHash], voter).voted;
    }

    /**
     * @dev Returns the votes of all candidates
     */
    function votes(bytes32 pollHash)
        external
        view
        override
        pollMustExist(pollHash)
        pollCreatorOnly(pollHash)
        returns (uint256[] memory)
    {
        return _polls.get(pollHash).votes;
    }

    /**
     * @dev Returns the list of winners
     */
    function winners(bytes32 pollHash)
        external
        view
        override
        pollMustExist(pollHash)
        didExpire(pollHash)
        returns (uint256[] memory)
    {
        return _winners[pollHash];
    }

    /**
     * @dev Returns the expiration block
     */
    function expire(bytes32 pollHash) external view override pollMustExist(pollHash) returns (uint256) {
        return _polls.get(pollHash).expire;
    }

    /**
     * @dev Returns the hash of the last poll
     */
    function getLastPollHash() external view returns (bytes32) {
        bytes32 key;
        (key, ) = _polls.at(_polls.length() - 1);
        return key;
    }

    /**
     * @dev Returns the status of the poll
     */
    function finished(bytes32 pollHash) external view override pollMustExist(pollHash) returns (bool) {
        return _polls.get(pollHash).finished;
    }

    uint256[46] private __gap;
}
