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
    using EnumerableVotersMap for EnumerableVotersMap.Voter;
    using EnumerablePollsMap for EnumerablePollsMap.Map;
    using EnumerablePollsMap for EnumerablePollsMap.Poll;

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

    function createPoll(
        uint256 candidates,
        string memory uri,
        uint256 newDuration
    ) public virtual override returns (bytes32) {
        bytes32 pollHash = super.createPoll(candidates, uri, newDuration);

        uint256 n = _polls.get(pollHash).candidates;

        _rank = new uint256[][](n);
        for (uint256 i = 0; i < n; i++) {
            _rank[i] = new uint256[](n);
        }

        return pollHash;
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
    function vote(bytes32 pollHash, uint256[] memory userRanking) public override didNotExpire(pollHash) {
        require(userRanking.length == _polls.get(pollHash).candidates, "Voting must be casted for all candidates.");
        for (uint256 i = 0; i < userRanking.length; i++) {
            require(userRanking[i] < _polls.get(pollHash).candidates, "Candidate doesn't exist.");
        }

        EnumerableVotersMap.Voter storage ranker = _voters[pollHash].getUnchecked(msg.sender);

        uint256[] memory previousRank;
        if (ranker.voted) {
            (, previousRank) = _decodeVote(ranker.candidates, ranker.voterAndVote);
            _updateVotes(previousRank, false);
        } else {
            ranker.voted = true;
            ranker.candidates = userRanking.length;
        }

        _updateVotes(userRanking, true);
        ranker.voterAndVote = _encodeVote(msg.sender, userRanking);
    }

    /**
     * @dev Calculates `_winners` and returns true if there is only one winner, false otherwise.
     */
    function _calculateWinners(bytes32 pollHash, EnumerablePollsMap.Poll memory poll)
        internal
        virtual
        override
        returns (bool)
    {
        bool hasWinners = false;

        // Temporary memory array to avoid the use of a storage variable
        uint256[] memory temp = new uint256[](poll.candidates);
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

        if (size > 0) {
            for (uint256 i = 0; i < size; i++) {
                _winners[pollHash].push(temp[i]);
            }
            hasWinners = true;
        }
        return (hasWinners);
    }

    uint256[49] private __gap;
}
