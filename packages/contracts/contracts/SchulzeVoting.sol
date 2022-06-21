// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.3;

import "@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol";
import "./utils/QuickSort.sol";
import "./CondorcetVoting.sol";

/**
 * @dev Schulze Voting System.
 *      If there is no Condorce winner, it calculates a Schulze Winner by weighing other paths
 *      between each pair of candidates.
 */
contract SchulzeVoting is CondorcetVoting {
    using EnumerableVotersMap for EnumerableVotersMap.Map;
    using EnumerableVotersMap for EnumerableVotersMap.Voter;
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
    function _calculateWinners(bytes32 pollHash) internal virtual override returns (bool) {
        if (!super._calculateWinners(pollHash)) {
            return _runSchulzeVoting(pollHash);
        } else {
            return true;
        }
    }

    /**
     * @dev Calculats Schulze winner(s) returning a ranked list: { place: 1, indexes: [1, 3] }
     */
    function _runSchulzeVoting(bytes32 pollHash) internal returns (bool) {
        uint256 n = _rank.length;

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
                    if (_rank[i][j] > _rank[j][i]) {
                        path[i][j] = _rank[i][j];
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

        ranksToGroups(pollHash, wins);

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
        bytes32 pollHash,
        uint256[] memory ranks /** pure */
    ) public returns (uint256[] memory) {
        uint256 n = ranks.length;
        uint256[] memory byRank = new uint256[](n);

        // // Temporary memory array to avoid the use of a storage variable
        uint256[] memory temp = new uint256[](_polls.get(pollHash).candidates);
        uint256 size = 0;

        QuickSort.sortRef(ranks, byRank);

        uint256 place = 1;
        temp[size++] = byRank[0];

        for (uint256 i = 1; i < byRank.length; i++) {
            place++;
            if (ranks[byRank[i]] != ranks[byRank[i - 1]]) {
                break;
            } else {
                temp[size++] = byRank[i];
            }
        }

        for (uint256 i = 0; i < size; i++) {
            _winners[pollHash].push(temp[i]);
        }

        return _winners[pollHash];
    }

    uint256[50] private __gap;
}
