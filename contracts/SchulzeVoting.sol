pragma solidity ^0.8.3;

import "./utils/QuickSort.sol";

/*
 * n - The number of candidates in the election.
 *
 * A value of five means there could be 5 candidates, e.g.
 * ["A", "B", "C", "D", "E"]
 *
 * ballots - A list of ballots that rank candidates
 *
 *    Ex. [
 *      [1, 2, 2, 3, 3], // This ballot prefers A, otherwise prefers B or C, and prefers D or E least.
 *      [2, 2, 2, 1, 2], // This ballot prefers D and is otherwise indifferent
 *    ]
 *
 * Returns a ranked list of candidates.
 *
 *    Ex.
 *    [
 *      { place: 1, indexes: [1, 3] },
 *      { place: 3, indexes: [2, 4] },
 *      { place: 5, indexes: [0] }
 *    ]
 *
 *    In this example B and C win, C and E tie for third, and A comes in last.
 */
contract SchulzeVoting {
    struct Group {
        uint256 place;
        uint256[] indexes;
    }

    Group _group;

    Group[] _result;

    function _max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a >= b ? a : b;
    }

    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a <= b ? a : b;
    }

    function run(
        uint256 n,
        uint256[][] memory ballots /** pure */
    ) public returns (Group[] memory) {
        // Initialize some tables
        uint256[][] memory d = new uint256[][](n);
        uint256[][] memory p = new uint256[][](n);

        for (uint256 i = 0; i < n; i++) {
            d[i] = new uint256[](ballots.length);
            p[i] = new uint256[](ballots.length);
        }

        // Record preferences for each matchup
        for (uint256 k = 0; k < n; k++) {
            for (uint256 i = 0; i < n; i++) {
                for (uint256 j = 0; j < n; j++) {
                    if (i != j) {
                        // For each distinct pair of candidates, record each preference
                        if (ballots[k][i] < ballots[k][j]) {
                            d[i][j]++;
                        }
                    }
                }
            }
        }

        // Calculate strongest paths (Floyd-Warshall algorithm)

        // Initialize trivial paths
        for (uint256 i = 0; i < n; i++) {
            for (uint256 j = 0; j < n; j++) {
                if (i != j) {
                    if (d[i][j] > d[j][i]) {
                        p[i][j] = d[i][j];
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
                            p[j][k] = _max(p[j][k], _min(p[j][i], p[i][k]));
                        }
                    }
                }
            }
        }

        // Count the number of pairwise wins per candidate
        uint256[] memory wins = new uint256[](n);
        for (uint256 i = 0; i < n; i++) {
            for (uint256 j = 0; j < n; j++) {
                if (i != j && p[i][j] > p[j][i]) {
                    wins[i]++;
                }
            }
        }

        // Rank the candidates by wins
        return ranksToGroups(wins);
    }

    // /*
    // * Accepts the same arguments as run, and checks if they are valid.
    // * Returns a iterable stream of error strings. If no errors are returned,
    // * the arguments are valid.
    // */
    // exports.validate = function*(candidates, ballots) {
    // let n = null;
    // if (candidates instanceof Array) {
    //     n = candidates.length;
    //     for (const c of candidates) {
    //     if (typeof c !== "string") {
    //         yield "each candidate must be a string";
    //     }
    //     }
    // } else {
    //     yield "candidates must be an array";
    // }

    // if (ballots instanceof Array) {
    //     for (const b of ballots) {
    //     if (b instanceof Array) {
    //         if (n !== null && b.length !== n) {
    //         yield "each ballot must contain a rank for each candidate";
    //         }
    //         for (const r of b) {
    //         if (typeof r !== "number") {
    //             yield "each candidate in a ballot must be given a number";
    //         }
    //         }
    //     } else {
    //         yield "each ballot must be an array";
    //     }
    //     }
    // } else {
    //     yield "ballots must be an array";
    // }
    // };

    /**
     * Takes in some ranks, e.g. [3, 1, 2, 1, 2],
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

        for (uint256 i = 0; i < n; i++) {
            byRank[ranks[i]] = i;
        }

        uint256[] memory temp = QuickSort.sort(byRank);

        uint256 place = 1;

        // TODO Change to memory
        _group.place = place;
        _group.indexes.push(temp[0]);
        _result.push(_group);
        for (uint256 i = 1; i < temp.length; i++) {
            place++;
            if (temp[i] != temp[i - 1]) {
                _group.place = place;
                _group.indexes.push(temp[i]);
                _result.push(_group);
            } else {
                _result[_result.length - 1].indexes.push(temp[i]);
            }
        }
        return _result;
    }

    // /**
    // * Takes a total number of candidates, and an ordering grouping, e.g.
    // * groupsToRanks(5, [[0, 2], [1, 4]]), and returns a rank for each candidate, e.g.
    // * [1, 2, 1, 3, 2]. Note that missing candidates are
    // * assumed to be ranked last.
    // */
    // exports.groupsToRanks = (n, groups) => {
    // const ranks = Array(n).fill(groups.length + 1);
    // groups.forEach((group, i) => {
    //     group.forEach(index => {
    //     ranks[index] = i + 1;
    //     });
    // });
    // return ranks;
    // };
}
