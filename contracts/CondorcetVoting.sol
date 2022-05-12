// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.3;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./Ballot.sol";

contract CondorcetVoting is Ballot {
    using AddressUpgradeable for address;
    using EnumerableVotersMap for EnumerableVotersMap.Map;
    using EnumerableVotersMap for EnumerableVotersMap.Voter;

    // TODO possible optimization: main diagonal is not used
    uint256[][] private _rank;

    function initialize(string[] memory candidates) external initializer {
        __Condorcet_init(candidates);
    }

    // solhint-disable-next-line func-name-mixedcase
    function __Condorcet_init(string[] memory candidates) internal {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __Condorcet_init_unchained(candidates);
    }

    // solhint-disable-next-line func-name-mixedcase
    function __Condorcet_init_unchained(string[] memory candidates) internal {
        require(candidates.length > 1, "The list of candidates should have at least two elements");

        uint256 n = _candidates.length;
        _candidates = candidates;

        _rank = new uint256[][](n);
        for (uint256 i = 0; i < n; i++) {
            _rank[i] = new uint256[](n);
        }
    }

    function vote(uint256[] memory userRanking) public override {
        EnumerableVotersMap.Voter storage ranker = _voters.getUnchecked(msg.sender);

        if (!ranker.voted) {
            for (uint256 i = 0; i < userRanking.length; i++) {
                for (uint256 j = i + 1; j < userRanking.length; j++) {
                    if (j != userRanking[i]) {
                        _rank[userRanking[i]][j] += 1;
                    }
                }
            }
            ranker.vote = userRanking;
            ranker.voted = true;
        }
        // TODO if already voted, redo the vote
    }
}
