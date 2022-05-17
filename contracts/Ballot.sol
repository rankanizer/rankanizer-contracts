// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.3;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "./utils/EnumerableVotersMap.sol";
import "./utils/QuickSort.sol";
import "./Votable.sol";

/**
 * @dev Traditional voting system
 */
contract Ballot is Votable, Initializable, OwnableUpgradeable {
    using AddressUpgradeable for address;
    using EnumerableVotersMap for EnumerableVotersMap.Map;
    using EnumerableVotersMap for EnumerableVotersMap.Voter;

    string[] internal _candidates;
    uint256[] private _votes;
    Group[] internal _winners;

    // Expiration block
    uint256 internal _expire;

    // Poll closed
    bool internal _finished;

    EnumerableVotersMap.Map internal _voters;

    function initialize(string[] memory candidates, uint256 newDuration) external virtual initializer {
        __Ballot_init(candidates, newDuration);
    }

    // solhint-disable-next-line func-name-mixedcase
    function __Ballot_init(string[] memory candidates, uint256 newDuration) internal {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __Ballot_init_unchained(candidates, newDuration);
    }

    // solhint-disable-next-line func-name-mixedcase
    function __Ballot_init_unchained(string[] memory candidates, uint256 newDuration) internal {
        require(candidates.length > 1, "The list of candidates should have at least two elements");
        require(newDuration > 0, "The duration of the poll must be greater than zero");

        _candidates = candidates;
        _expire = block.number + newDuration;

        _votes = new uint256[](_candidates.length);
        _finished = false;
    }

    /**
     * @dev checks if poll is still open. If expired, close the poll afterwards.
     */
    modifier didNotExpire() {
        require(_expire >= block.number, "This poll is closed. No more votes allowed");
        _;
        if (_expire == block.number) {
            closePoll();
        }
    }

    /**
     * @dev checks if poll didn't expire.
     */
    modifier didExpire() {
        require(_expire <= block.number, "This poll is not closed yet.");
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
    function vote(uint256[] memory ranking) external virtual override didNotExpire {
        require(ranking.length == 1, "Voting must be for only one candidate.");
        uint256 candidateIndex = ranking[0];
        require(candidateIndex < _candidates.length, "Candidate doesn't exist.");

        EnumerableVotersMap.Voter storage voter = _voters.getUnchecked(msg.sender);

        if (!voter.voted) {
            unchecked {
                _votes[candidateIndex]++;
                voter.voted = true;
            }
        } else {
            unchecked {
                _votes[voter.vote[0]]--;
                _votes[candidateIndex]++;
            }
        }
        voter.vote = [candidateIndex];
    }

    /**
     * @dev Closes the poll for voting
     *
     * Emits a {PollClosed} event.
     */
    function closePoll() public virtual override {
        require(!_finished, "This poll is closed already");
        _finished = true;
        _calculateWinners();
        emit PollClosed(_winners);
    }

    /**
     * @dev Calculates `_winners` and returns true if succesful.
     *
     */
    function _calculateWinners() internal virtual returns (bool) {
        if (_numberOfVotes() == 0) return false;

        uint256[] memory ref = new uint256[](_votes.length);
        QuickSort.sortRef(_votes, ref);

        uint256 winnerVotes = _votes[ref[0]];

        // Temporary memory array to avoid the use of a storage variable
        uint256[] memory temp = new uint256[](_candidates.length);
        uint256 size = 0;

        for (uint256 i = 0; i < ref.length; i++) {
            if (_votes[ref[i]] == winnerVotes) {
                temp[size++] = ref[i];
            } else break;
        }

        // Updates the _winners array
        Group memory group;
        group.place = 1;
        group.candidates = new uint256[](size);
        for (uint256 i = 0; i < size; i++) {
            group.candidates[i] = temp[i];
        }
        _winners.push(group);

        return true;
    }

    /**
     * @dev Calculates and returns the number of votes casted
     */
    function _numberOfVotes() internal view returns (uint256) {
        uint256 qty = 0;
        for (uint256 i = 0; i < _votes.length; i++) {
            qty += _votes[i];
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
    function votesOf(uint256 candidateIndex) external view override returns (uint256) {
        require(candidateIndex < _candidates.length, "Candidate doesn't exist.");
        return _votes[candidateIndex];
    }

    /**
     * @dev Returns the votes of all candidates
     */
    function votes() external view override returns (uint256[] memory) {
        return _votes;
    }

    /**
     * @dev Returns the list of winners
     */
    function winners() external view override didExpire returns (Group[] memory) {
        return _winners;
    }

    /**
     * @dev Returns the expiration block
     */
    function expire() external view override returns (uint256) {
        return _expire;
    }

    /**
     * @dev Returns the status of the poll
     */
    function finished() external view override returns (bool) {
        return _finished;
    }

    uint256[44] private __gap;
}
