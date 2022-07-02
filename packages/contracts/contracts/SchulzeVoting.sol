// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.3;

import "@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol";
import "./utils/QuickSort.sol";
import "./CondorcetVoting.sol";

/**
 * @dev Schulze Voting System.
 *      If there is no Condorcet winner, it calculates a Schulze Winner by weighing other paths
 *      between each pair of candidates.
 */
contract SchulzeVoting is CondorcetVoting {
    using EnumerablePollsMap for EnumerablePollsMap.Map;
    using EnumerablePollsMap for EnumerablePollsMap.Poll;

    function initialize() external override initializer {
        __SchulzeVoting_init();
    }

    // solhint-disable-next-line func-name-mixedcase
    function __SchulzeVoting_init() internal {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __Ballot_init_unchained();
        __CondorcetVoting_init_unchained();
    }

    /**
     * @dev It tries to find a Condorcet winner. If there isn't one, calculate Schulze winner(s)
     */
    function _calculateWinners(bytes32 hash, EnumerablePollsMap.Poll memory poll)
        internal
        virtual
        override
        returns (bool)
    {
        if (!super._calculateWinners(hash, poll)) {
            return _runSchulzeVoting(hash);
        } else {
            return true;
        }
    }

    /**
     * @dev It calculates Schulze winner(s) returning a ranked list: { place: 1, indexes: [1, 3] }
     */
    function _runSchulzeVoting(bytes32 hash) internal returns (bool) {
        uint256 n = _rankPerPoll[hash].length;

        // Paths Matrix
        uint256[][] memory path = new uint256[][](n);

        for (uint256 i = 0; i < n; i++) {
            path[i] = new uint256[](n);
        }
        // Calculate strongest paths (Floyd-Warshall algorithm)

        // Initialize trivial paths
        for (uint256 i = 0; i < n; i++) {
            for (uint256 j = 0; j < n; j++) {
                if (i != j) {
                    if (_rankPerPoll[hash][i][j] > _rankPerPoll[hash][j][i]) {
                        path[i][j] = _rankPerPoll[hash][i][j];
                    }
                }
            }
        }

        // Explore alternate paths
        for (uint256 i = 0; i < n; i++) {
            for (uint256 j = 0; j < n; j++) {
                if (i != j) {
                    for (uint256 k = 0; k < n; k++) {
                        if (i != k && j != k) {
                            path[j][k] = MathUpgradeable.max(path[j][k], MathUpgradeable.min(path[j][i], path[i][k]));
                        }
                    }
                }
            }
        }

        // Count the number of pairwise wins per candidate
        uint256[] memory wins = new uint256[](n);
        for (uint256 i = 0; i < n; i++) {
            for (uint256 j = 0; j < n; j++) {
                if (i != j && path[i][j] > path[j][i]) {
                    wins[i]++;
                }
            }
        }

        ranksToGroups(hash, wins);

        return true;
    }

    /**
     * @dev Takes in some `ranks`, e.g. [3, 1, 2, 1, 2],
     * and returns groups with places, e.g.
     *  [
     *    { place: 1, indexes: [1, 3] },
     *    { place: 3, indexes: [2, 4] },
     *    { place: 5, indexes: [0] }
     *  ]
     */
    function ranksToGroups(
        bytes32 hash,
        uint256[] memory ranks /** pure */
    ) public returns (uint256[] memory) {
        uint256 n = ranks.length;
        uint256[] memory byRank = new uint256[](n);

        QuickSort.sortRef(ranks, byRank);

        uint256 place = 1;
        _winners[hash].push(byRank[0]);

        for (uint256 i = 1; i < byRank.length; i++) {
            place++;
            if (ranks[byRank[i]] != ranks[byRank[i - 1]]) {
                break;
            } else {
                _winners[hash].push(byRank[i]);
            }
        }

        return _winners[hash];
    }

    uint256[50] private __gap;
}
