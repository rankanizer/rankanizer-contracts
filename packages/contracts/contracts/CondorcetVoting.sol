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

    // Optimizations for storage saving
    uint256 private constant _BITS_PER_CANDIDATE = 5;
    uint256 private constant _BITMASK = (2**_BITS_PER_CANDIDATE) - 1;

    mapping(bytes32 => EnumerableVotersMap.Map) _voters;

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

    function _encodeVote(address voter, uint256[] memory rank) internal pure returns (uint256 encodedVote) {
        encodedVote = uint256(uint160(voter)) << 96;
        uint256 size = rank.length;
        for (uint256 i = 0; i < size; i++) {
            encodedVote |= (rank[i] << (_BITS_PER_CANDIDATE * i));
        }
    }

    function _decodeVote(uint256 candidates, uint256 encodedVote)
        internal
        pure
        returns (address voter, uint256[] memory rank)
    {
        voter = address(uint160(encodedVote >> 96));
        rank = new uint256[](candidates);
        for (uint256 i = 0; i < candidates; i++) {
            rank[i] = encodedVote & _BITMASK;
            encodedVote >>= _BITS_PER_CANDIDATE;
        }
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
    function vote(bytes32 pollHash, uint256[] memory userRanking) public didNotExpire(pollHash) {
        require(userRanking.length == _polls.get(pollHash).candidates, "Voting must be casted for all candidates.");
        uint256 size = userRanking.length;
        uint256 candidates = _polls.getUnchecked(pollHash).candidates;
        for (uint256 i = 0; i < size; i++) {
            require(userRanking[i] < candidates, "Candidate doesn't exist.");
        }

        EnumerableVotersMap.Voter storage ranker = _voters[pollHash].getUnchecked(msg.sender);
        require(!ranker.voted, "Voter already voted. Call changeVote instead.");

        ranker.voted = true;
        ranker.candidates = uint128(userRanking.length);
    
        _addVotes(userRanking);
        ranker.voterAndVote = _encodeVote(msg.sender, userRanking);

        EnumerableVotersMap.set(_voters[pollHash], msg.sender, ranker);
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
    function changeVote(bytes32 pollHash, uint256[] memory userRanking) public didNotExpire(pollHash) {
        require(userRanking.length == _polls.get(pollHash).candidates, "Voting must be casted for all candidates.");
        uint256 size = userRanking.length;
        uint256 candidates = _polls.getUnchecked(pollHash).candidates;
        for (uint256 i = 0; i < size; i++) {
            require(userRanking[i] < candidates, "Candidate doesn't exist.");
        }

        EnumerableVotersMap.Voter storage ranker = _voters[pollHash].getUnchecked(msg.sender);
        require(ranker.voted, "Voter didn't vote yet. Call vote instead.");

        uint256[] memory previousRank;
        (, previousRank) = _decodeVote(ranker.candidates, ranker.voterAndVote);
        _updateVotes(userRanking, previousRank);
        ranker.voterAndVote = _encodeVote(msg.sender, userRanking);

        EnumerableVotersMap.set(_voters[pollHash], msg.sender, ranker);
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
        returns (uint256[] memory)
    {
        require(
            msg.sender == _polls.get(pollHash).owner || msg.sender == voterAddress,
            "Only the creator or the voter may call this method."
        );
        require(EnumerableVotersMap.contains(_voters[pollHash], voterAddress), "Voter must exist.");
        uint256[] memory voterVotes;
        EnumerableVotersMap.Voter memory voter = EnumerableVotersMap.get(_voters[pollHash], voterAddress);
        (, voterVotes) = _decodeVote(voter.candidates, voter.voterAndVote);
        return voterVotes;
    }

    /**
     * @dev Returns if `voter` has voted
     *
     */
    function didVote(bytes32 pollHash, address voter) external view override pollMustExist(pollHash) returns (bool) {
        if (!EnumerableVotersMap.contains(_voters[pollHash], voter)) return false;
        return EnumerableVotersMap.get(_voters[pollHash], voter).voted;
    }

    uint256[49] private __gap;
}
