// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.3;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./Ballot.sol";

/**
 * @dev Condorcet Voting System.
 *      Elects the candidate who wins a majority of the vote in
 *      every head-to-head election against each of the other candidates.
 */
contract CondorcetVoting is Ballot {
    using AddressUpgradeable for address;
    using EnumerableVotersMap for EnumerableVotersMap.Map;
    using EnumerableGroupsMap for EnumerableGroupsMap.Map;
    using EnumerableVotersMap for EnumerableVotersMap.Voter;
    using EnumerableGroupsMap for EnumerableGroupsMap.Group;

    // Possible optimization: main diagonal is not used
    uint256[][] internal _rank;

    function initialize() external virtual override initializer {
        __CondorcetVoting_init();
    }

    // solhint-disable-next-line func-name-mixedcase
    function __CondorcetVoting_init() internal {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __Ballot_init_unchained();
        __CondorcetVoting_init_unchained();
    }

    // solhint-disable-next-line func-name-mixedcase
    function __CondorcetVoting_init_unchained() internal {}

    function createPoll(string[] memory candidates, uint256 newDuration) public override returns (uint256) {
        require(candidates.length > 1, "The list of candidates should have at least two elements");

        uint256 pollId = super.createPoll(candidates, newDuration);

        uint256 n = _polls[pollId]._candidates.length;

        _rank = new uint256[][](n);
        for (uint256 i = 0; i < n; i++) {
            _rank[i] = new uint256[](n);
        }

        return pollId;
    }

    /**
     * @dev Updates `_rank`with `votes` according to `add`: if true it adds votes, if false it subtracts votes.
     */
    function _updateVotes(uint256[] memory votes, bool add) private {
        unchecked {
            for (uint256 i = 0; i < votes.length; i++) {
                for (uint256 j = 0; j < votes.length; j++) {
                    if (j != i) {
                        if (votes[i] < votes[j]) {
                            if (add) _rank[i][j] += 1;
                            else _rank[i][j] -= 1;
                        }
                    }
                }
            }
        }
    }

    /**
     * @dev Computes the votes ('userRanking') of a user. If a user had already voted, undo the previous vote.
     *
     * Requirements:
     *
     * - `userRanking` must have for every position, the preference of a user.
     *    For instance, if a user ranking order is DBCA, the userRanking should be [3, 1, 2, 0]
     *    if there's no preference between candidates you may repeat preferences: [2, 1, 2, 0]
     * - Every candidate in `userRanking` should exist.
     * - `userRanking` must have the same size as `_candidates`
     */
    function vote(uint256 pollId, uint256[] memory userRanking) public override didNotExpire(pollId) {
        require(userRanking.length == _polls[pollId]._candidates.length, "Voting must be casted for all candidates.");
        for (uint256 i = 0; i < userRanking.length; i++) {
            require(userRanking[i] < _polls[pollId]._candidates.length, "Candidate doesn't exist.");
        }

        EnumerableVotersMap.Voter storage ranker = _voters[pollId].getUnchecked(msg.sender);

        if (ranker.voted) {
            _updateVotes(ranker.vote, false);
        } else {
            ranker.voted = true;
        }

        _updateVotes(userRanking, true);
        ranker.vote = userRanking;
    }

    /**
     * @dev Calculates `_winners` and returns true if there is only one winner, false otherwise.
     */
    function _calculateWinners(uint256 pollId) internal virtual override returns (bool) {
        bool hasWinners = false;

        // Temporary memory array to avoid the use of a storage variable
        uint256[] memory temp = new uint256[](_polls[pollId]._candidates.length);
        uint256 size = 0;

        for (uint256 i = 0; i < _rank.length; i++) {
            uint256 victories = 0;
            for (uint256 j = 0; j < _rank.length; j++) {
                if (i != j) {
                    if (_rank[i][j] > _rank[j][i]) {
                        victories++;
                    }
                }
            }
            if (victories == _rank.length - 1) {
                temp[size++] = i;
                break;
            }
        }

        // if (size > 0) {
        //     EnumerableGroupsMap.Group storage group = _winners[pollId].getUnchecked(msg.sender);
        //     group.place = 1;
        //     group.candidates = new uint256[](size);
        //     for (uint256 i = 0; i < size; i++) {
        //         group.candidates[i] = temp[i];
        //     }
        //     hasWinners = true;
        //     EnumerableGroupsMap.set(_winners[pollId], msg.sender, group);
        // }

        if (size > 0) {
            for (uint256 i = 0; i < size; i++) {
                _winners[pollId].push(temp[i]);
            }
            hasWinners = true;
        }
        return (hasWinners);
    }

    uint256[49] private __gap;
}
