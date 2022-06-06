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
    function initialize(string[] memory candidates, uint256 newDuration) external override initializer {
        __SchulzeVoting_init(candidates, newDuration);
    }

    // solhint-disable-next-line func-name-mixedcase
    function __SchulzeVoting_init(string[] memory candidates, uint256 newDuration) internal {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __Ballot_init_unchained(candidates, newDuration);
        __CondorcetVoting_init_unchained(candidates);
    }

    /**
     * @dev It tries to find a Condorcet winner. If there isn't one, calculate Schulze winner(s)
     */
    function _calculateWinners() internal virtual override returns (bool) {
        if (!super._calculateWinners()) {
            return _runSchulzeVoting();
        } else {
            return true;
        }
    }

    /**
     * @dev Calculats Schulze winner(s) returning a ranked list: { place: 1, indexes: [1, 3] }
     */
    function _runSchulzeVoting() internal returns (bool) {
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

        ranksToGroups(wins);

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
        uint256[] memory ranks /** pure */
    ) public returns (Group[] memory) {
        uint256 n = ranks.length;
        uint256[] memory byRank = new uint256[](n);

        Group memory group;

        // Temporary memory array to avoid the use of a storage variable
        uint256[] memory temp = new uint256[](_candidates.length);
        uint256 size = 0;

        QuickSort.sortRef(ranks, byRank);

        uint256 place = 1;
        group.place = place;
        temp[size++] = byRank[0];

        for (uint256 i = 1; i < byRank.length; i++) {
            place++;
            if (ranks[byRank[i]] != ranks[byRank[i - 1]]) {
                break;
            } else {
                temp[size++] = byRank[i];
            }
        }

        group.candidates = new uint256[](size);
        for (uint256 i = 0; i < size; i++) {
            group.candidates[i] = temp[i];
        }
        _winners.push(group);
        return _winners;
    }

    uint256[50] private __gap;
}
