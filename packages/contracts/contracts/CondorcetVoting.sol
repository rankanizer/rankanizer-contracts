// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.3;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./Ballot.sol";
import "./utils/Vote.sol";

/**
 * @dev Condorcet Voting System.
 *      Elects the candidate who wins a majority of the vote in
 *      every head-to-head election against each of the other candidates.
 */
contract CondorcetVoting is Ballot {
    using AddressUpgradeable for address;
    using EnumerablePollsMap for EnumerablePollsMap.Map;
    using EnumerablePollsMap for EnumerablePollsMap.Poll;
    using Vote for Vote.Encoded;
    using Vote for Vote.Decoded;

    mapping(bytes32 => mapping(address => Vote.Encoded)) private _voters;

    // Possible optimization: main diagonal is not used
    uint256[][] internal _rank;

    function initialize() external virtual initializer {
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
        uint32 candidates,
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
    function _updateVotes(uint256[] memory current, uint256[] memory previous) private {
        unchecked {
            for (uint256 i = 0; i < previous.length; i++) {
                for (uint256 j = i + 1; j < previous.length; j++) {
                    if (previous[i] < previous[j]) {
                        _rank[i][j] -= 1;
                    }
                    if (previous[j] < previous[i]) {
                        _rank[j][i] -= 1;
                    }
                    if (current[i] < current[j]) {
                        _rank[i][j] += 1;
                    }
                    if (current[j] < current[i]) {
                        _rank[j][i] += 1;
                    }
                }
            }
        }
    }

    /**
     * @dev Updates `_rank`with `votes` according to `add`: if true it adds votes, if false it subtracts votes.
     */
    function _addVotes(uint256[] memory votes) private {
        unchecked {
            for (uint256 i = 0; i < votes.length; i++) {
                for (uint256 j = i + 1; j < votes.length; j++) {
                    if (votes[i] < votes[j]) {
                        _rank[i][j] += 1;
                    }
                    if (votes[j] < votes[i]) {
                        _rank[j][i] += 1;
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
    function vote(bytes32 pollHash, uint256[] memory rank) public didNotExpire(pollHash) {
        require(rank.length == _polls.get(pollHash).candidates, "Voting must be casted for all candidates.");
        uint256 size = rank.length;
        uint256 candidates = _polls.getUnchecked(pollHash).candidates;
        for (uint256 i = 0; i < size; i++) {
            require(rank[i] < candidates, "Candidate doesn't exist.");
        }

        // Read and decode vote from storage
        Vote.Decoded memory voter = _voters[pollHash][msg.sender].decode();
        require(voter.voter == address(0), "Account already voted, use changeVote instead");

        _addVotes(rank);

        voter.voter = msg.sender;
        voter.rank = rank;

        // Encode and save vote
        _voters[pollHash][msg.sender] = voter.encode();
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
    function changeVote(bytes32 pollHash, uint256[] memory rank) public didNotExpire(pollHash) {
        require(rank.length == _polls.get(pollHash).candidates, "Voting must be casted for all candidates.");
        uint256 size = rank.length;
        uint256 candidates = _polls.getUnchecked(pollHash).candidates;
        for (uint256 i = 0; i < size; i++) {
            require(rank[i] < candidates, "Candidate doesn't exist.");
        }

        // Read and decode vote from storage
        Vote.Decoded memory voter = _voters[pollHash][msg.sender].decode();
        require(voter.voter == msg.sender, "This account hasn't voted, use submitVote instead");

        _updateVotes(rank, voter.rank);

        voter.rank = rank;

        // Encode and save vote
        _voters[pollHash][msg.sender] = voter.encode();
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

    /**
     * @dev Returns the vote of `voter`
     *
     * Requirements:
     *
     * - `voter` must have voted
     * - `voter` must exist
     */
    function voteOf(bytes32 pollHash, address voterAddress)
        external
        view
        pollMustExist(pollHash)
        returns (Vote.Decoded memory)
    {
        require(
            msg.sender == _polls.get(pollHash).owner || msg.sender == voterAddress,
            "Only the creator or the voter may call this method."
        );
        require(_voters[pollHash][voterAddress].data != 0x0, "Voter must exist.");

        return _voters[pollHash][voterAddress].decode();
    }

    /**
     * @dev Returns if `voter` has voted
     *
     */
    function didVote(bytes32 pollHash, address voter) external view override pollMustExist(pollHash) returns (bool) {
        return _voters[pollHash][voter].data != 0x0;
    }

    uint256[48] private __gap;
}
