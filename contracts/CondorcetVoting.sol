// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.3;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./Ballot.sol";

contract CondorcetVoting is Initializable, OwnableUpgradeable {

    struct Ranker {
        bool ranked;
        uint256[] ranking;
    }

    string[] private _candidates;

    // TODO possible optimization: main diagonal is not used
    uint256[][] private _rank;

    // TODO change to enumerable map
    mapping(address => Ranker) public voters;

    function initialize(string[] memory candidates) external initializer {
        __Condorcet_init(candidates);
    }

    function __Condorcet_init(string[] memory candidates) internal {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __Condorcet_init_unchained(candidates);
    }

    function __Condorcet_init_unchained(string[] memory candidates) internal {
        require(candidates.length > 1, "The list of candidates should have at least two elements");

        uint256 n = _candidates.length;
        _candidates = candidates;

        _rank = new uint256[][](n);
        for (uint256 i = 0; i < n; i++) {
            _rank[i] = new uint[](n);
        }
    }

    function vote(uint256[] memory userRanking) public {

        Ranker storage ranker = voters[msg.sender];

        if (!ranker.ranked) {
            for (uint256 i = 0; i < userRanking.length; i++) {
                for (uint256 j = i+1; j < userRanking.length; j++) {
                    if (j != userRanking[i]) {
                        _rank[userRanking[i]][j] += 1;
                    }
                }
            }
            ranker.ranking = userRanking;
            ranker.ranked = true;
        } 
        // TODO if already voted, redo the vote
    }
}