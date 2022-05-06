// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.3;

import './QuickSort.sol';

/// @author FVB
/// @title  Ballot
// - Ao criar o contrato, vc fornece um array opcoes, e um parametro "duration" que é em quantos blocos a transação vai terminar.
// - Escolha única, cada conta pode votar uma única vez
// - A conta pode mudar o voto
// - Opção com mais votos vence (obs: pode haver empate)
// - Depois de finalizada, nenhum voto mais é aceito, a conta não pode mais mudar o voto
contract Ballot {
    string[] private _candidates;
    uint256[] private _votes;
    uint256[] private _winners;

    uint256 private _expire;
    bool private _finished;

    struct Voter {
        bool voted;
        uint256 vote;
    }

    mapping(address => Voter) public voters;

    constructor(string[] memory candidates, uint256 newDuration) {
        require(candidates.length > 1, "The list of candidates should have at least two elements");
        require(newDuration > 0, "The duration of the poll must be greater than zero");

        _candidates = candidates;
        _expire = block.number + newDuration;

        _votes = new uint256[](_candidates.length);
        _finished = false;
    }

    event PollClosed(uint256[] winners);

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

    function vote(uint256 candidateIndex) public didNotExpire {
        require(candidateIndex < _candidates.length, "Candidate doesn't exist.");

        Voter storage voter = voters[msg.sender];

        if (!voter.voted) {
            _votes[candidateIndex]++;
            voters[msg.sender].voted = true;
        } else {
            unchecked {
                _votes[voters[msg.sender].vote]--;
                _votes[candidateIndex]++;
            }
        }
        voters[msg.sender].vote = candidateIndex;
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

        QuickSort sort = new QuickSort();
        uint256[] memory temp = sort.sort(_votes, ref);

        uint256 winnerVotes = _votes[temp[0]];

        for (uint256 i = 0; i < temp.length; i++) {
            if (_votes[temp[i]] == winnerVotes) _winners.push(temp[i]);
            else break;
        }
    }

    function votesOf(uint256 candidateIndex) public view returns (uint256) {
        require(candidateIndex < _candidates.length, "Candidate doesn't exist.");
        return _votes[candidateIndex];
    }

    function votes() public view returns (uint256[] memory) {
        return _votes;
    }

    function winners() public view didExpire returns (uint256[] memory) {
        return _winners;
    }

    function expire() public view returns (uint256) {
        return _expire;
    }

    function finished() public view returns (bool) {
        return _finished;
    }
}
