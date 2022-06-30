// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.3;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "./utils/EnumerablePollsMap.sol";
import "./utils/QuickSort.sol";
import "./Votable.sol";

/**
 * @dev Traditional voting system
 */
abstract contract Ballot is Votable, Initializable, OwnableUpgradeable {
    using AddressUpgradeable for address;
    using EnumerablePollsMap for EnumerablePollsMap.Map;
    using EnumerablePollsMap for EnumerablePollsMap.Poll;

    // TODO Issue #6 - Refactoring the code
    mapping(bytes32 => uint256[]) _winners;

    mapping(address => bytes32[]) _pollsByOwner;

    // Polls of the contract
    EnumerablePollsMap.Map internal _polls;

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
        uint32 candidates,
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
            owner: msg.sender,
            uri: uri
        });

        // EnumerablePollsMap.Poll memory poll = _polls.get(0x0);
        bytes32 pollHash = newPoll.hash();

        _polls.set(pollHash, newPoll);

        _pollsByOwner[msg.sender].push(pollHash);

        emit PollCreated(pollHash, msg.sender, uri);

        return pollHash;
    }

    /**
     * @dev checks if it's the creator of the poll.
     */
    modifier pollOwnerOnly(bytes32 pollHash) {
        require(msg.sender == _polls.get(pollHash).owner, "This method should be called only by the poll's creator.");
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
    }

    /**
     * @dev checks if poll didn't expire.
     */
    modifier didExpire(bytes32 pollHash) {
        require(_polls.get(pollHash).expire <= block.number, "This poll is not closed yet.");
        _;
    }

    /**
     * @dev Closes the poll for voting
     *
     * Emits a {PollClosed} event.
     */
    function closePoll(bytes32 pollHash) external virtual override pollMustExist(pollHash) pollOwnerOnly(pollHash) {
        _closePoll(pollHash);
    }

    /**
     * @dev Closes the poll for voting, must only be called internally
     *
     * Emits a {PollClosed} event.
     */
    function _closePoll(bytes32 pollHash) internal {
        EnumerablePollsMap.Poll storage poll = _polls.get(pollHash);
        require(!poll.finished, "This poll is closed already");
        poll.finished = true;
        _calculateWinners(pollHash, poll);
        emit PollClosed(pollHash, _winners[pollHash]);
    }

    /**
     * @dev Calculates `_winners` and returns true if succesful.
     *
     */
    function _calculateWinners(bytes32 pollHash, EnumerablePollsMap.Poll memory poll) internal virtual returns (bool) {
        if (_numberOfVotes(pollHash) == 0) return false;

        uint256[] memory ref = new uint256[](poll.votes.length);
        QuickSort.sortRef(poll.votes, ref);

        uint256 winnerVotes = poll.votes[ref[0]];

        // Temporary memory array to avoid the use of a storage variable
        uint256[] memory temp = new uint256[](poll.candidates);
        uint256 size = 0;

        for (uint256 i = 0; i < ref.length; i++) {
            if (poll.votes[ref[i]] == winnerVotes) {
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
        uint256 size = _polls.get(pollHash).votes.length;
        for (uint256 i = 0; i < size; i++) {
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
        pollOwnerOnly(pollHash)
        returns (uint256)
    {
        require(candidateIndex < _polls.get(pollHash).candidates, "Candidate doesn't exist.");
        return _polls.get(pollHash).votes[candidateIndex];
    }

    /**
     * @dev Returns the votes of all candidates
     */
    function votes(bytes32 pollHash)
        external
        view
        override
        pollMustExist(pollHash)
        pollOwnerOnly(pollHash)
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
     * @dev Returns the status of the poll
     */
    function finished(bytes32 pollHash) external view override pollMustExist(pollHash) returns (bool) {
        return _polls.get(pollHash).finished;
    }

    /**
     * @dev Returns the poll count
     */
    function pollCount() public view returns (uint256) {
        return _polls.length();
    }

    /**
     * @dev Returns a poll by index
     */
    function pollByIndex(uint256 index) public view returns (bytes32, EnumerablePollsMap.Poll memory) {
        return _polls.at(index);
    }

    /**
     * @dev Returns a poll by hash
     */
    function pollByHash(bytes32 pollHash) public view returns (EnumerablePollsMap.Poll memory) {
        return _polls.get(pollHash);
    }

    /**
     * @dev Returns the poll count of a specific owner
     */
    function ownerPollCount(address owner) public view returns (uint256) {
        return _pollsByOwner[owner].length;
    }

    /**
     * @dev Returns a specific poll of a specific owner
     */
    function ownerPollByIndex(address owner, uint256 index) public view returns (bytes32) {
        return _pollsByOwner[owner][index];
    }

    uint256[47] private __gap;
}
