// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.3;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "./utils/EnumerableVotersMap.sol";
import "./utils/QuickSort.sol";
import "./Votable.sol";

/// @author FVB
/// @title  Ballot
contract Ballot is Votable, Initializable, OwnableUpgradeable {
    using AddressUpgradeable for address;
    using EnumerableVotersMap for EnumerableVotersMap.Map;
    using EnumerableVotersMap for EnumerableVotersMap.Voter;

    string[] private _candidates;
    uint256[] private _votes;
    Group[] private _winners;
    Group _group;

    uint256 private _expire;
    bool private _finished;

    EnumerableVotersMap.Map private _voters;

    function initialize(string[] memory candidates, uint256 newDuration) external initializer {
        __Ballot_init(candidates, newDuration);
    }

    function __Ballot_init(string[] memory candidates, uint256 newDuration) internal {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __Ballot_init_unchained(candidates, newDuration);
    }

    function __Ballot_init_unchained(string[] memory candidates, uint256 newDuration) internal {
        require(candidates.length > 1, "The list of candidates should have at least two elements");
        require(newDuration > 0, "The duration of the poll must be greater than zero");

        _candidates = candidates;
        _expire = block.number + newDuration;

        _votes = new uint256[](_candidates.length);
        _finished = false;
    }

    modifier didNotExpire() {
        require(_expire >= block.number, "This poll is closed. No more votes allowed");
        _;
        if (_expire == block.number) {
            closePoll();
        }
    }

    modifier didExpire() {
        require(_expire <= block.number, "This poll is not closed yet.");
        _;
    }

    function vote(uint256[] memory ranking) external override didNotExpire {
        require(ranking.length == 1, "Voting must be for only one candidate.");
        uint256 candidateIndex = ranking[0];
        require(candidateIndex < _candidates.length, "Candidate doesn't exist.");

        EnumerableVotersMap.Voter storage voter = _voters.getUnchecked(msg.sender);

        if (!voter.voted) {
            _votes[candidateIndex]++;
            voter.voted = true;
        } else {
            unchecked {
                _votes[voter.vote]--;
                _votes[candidateIndex]++;
            }
        }
        voter.vote = candidateIndex;
    }

    function closePoll() public {
        require(!_finished, "This poll is closed already");
        _finished = true;
        _calculateWinners();
        emit PollClosed(_winners);
    }

    function _calculateWinners() internal {
        uint256[] memory ref = new uint256[](_votes.length);

        for (uint256 i = 0; i < _votes.length; i++) {
            ref[i] = i;
        }

        uint256[] memory temp = QuickSort.sortRef(_votes, ref);

        uint256 winnerVotes = _votes[temp[0]];

        _group.place = 1;
        _group.candidates.push(temp[0]);
        _winners.push(_group);

        for (uint256 i = 1; i < temp.length; i++) {
            if (_votes[temp[i]] == winnerVotes) {
                _winners[0].candidates.push(temp[i]);
            }
            else break;
        }
    }

    function votesOf(uint256 candidateIndex) external override view returns (uint256) {
        require(candidateIndex < _candidates.length, "Candidate doesn't exist.");
        return _votes[candidateIndex];
    }

    function votes() external override view returns (uint256[] memory) {
        return _votes;
    }

    function winners() external override view didExpire returns (Group[] memory) {
        return _winners;
    }

    function expire() external override view returns (uint256) {
        return _expire;
    }

    function finished() external override view returns (bool) {
        return _finished;
    }

    uint256[44] private __gap;
}
