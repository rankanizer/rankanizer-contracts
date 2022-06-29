// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.3;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "./utils/EnumerableSingleVotersMap.sol";
import "./utils/EnumerablePollsMap.sol";
import "./utils/QuickSort.sol";
import "./Ballot.sol";

/**
 * @dev Traditional voting system
 */
contract SingleVoting is Ballot {
    using AddressUpgradeable for address;
    using EnumerableSingleVotersMap for EnumerableSingleVotersMap.Map;
    using EnumerableSingleVotersMap for EnumerableSingleVotersMap.SingleVoter;
    using EnumerablePollsMap for EnumerablePollsMap.Map;
    using EnumerablePollsMap for EnumerablePollsMap.Poll;

    mapping(bytes32 => EnumerableSingleVotersMap.Map) _voters;

    function initialize() external virtual initializer {
        __SingleVoting_init();
    }

    // solhint-disable-next-line func-name-mixedcase
    function __SingleVoting_init() internal {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __Ballot_init_unchained();
        __SingleVoting_init_unchained();
    }

    // solhint-disable-next-line func-name-mixedcase
    function __SingleVoting_init_unchained() internal {}

    /**
     * @dev Register the `ranking` of the account
     *
     * Requirements:
     *
     * - `ranking` must have only one elemnent.
     * - the voted candidate must exist.
     *
     */
    function vote(bytes32 pollHash, uint256 candidateIndex)
        external
        virtual
        pollMustExist(pollHash)
        didNotExpire(pollHash)
    {
        uint256 candidates = _polls.get(pollHash).candidates;
        require(candidateIndex < candidates, "Candidate doesn't exist.");

        EnumerableSingleVotersMap.SingleVoter storage voter = _voters[pollHash].getUnchecked(msg.sender);

        if (voter.voted) {
            unchecked {
                _polls.get(pollHash).votes[voter.vote]--;
            }
        } else voter.voted = true;

        unchecked {
            _polls.get(pollHash).votes[candidateIndex]++;
        }

        voter.vote = candidateIndex;
        EnumerableSingleVotersMap.set(_voters[pollHash], msg.sender, voter);
    }

    /**
     * @dev Returns the vote of `voter`
     *
     * Requirements:
     *
     * - `voter` must have voted
     * - `voter` must exist
     */
    function voteOf(bytes32 pollHash, address voterAddress) external view pollMustExist(pollHash) returns (uint256) {
        require(
            msg.sender == _polls.get(pollHash).owner || msg.sender == voterAddress,
            "Only the creator or the voter may call this method."
        );
        require(EnumerableSingleVotersMap.contains(_voters[pollHash], voterAddress), "Voter must exist.");
        EnumerableSingleVotersMap.SingleVoter memory voter = EnumerableSingleVotersMap.get(
            _voters[pollHash],
            voterAddress
        );
        return voter.vote;
    }

    /**
     * @dev Returns if `voter` has voted
     *
     */
    function didVote(bytes32 pollHash, address voter) external view override pollMustExist(pollHash) returns (bool) {
        if (!EnumerableSingleVotersMap.contains(_voters[pollHash], voter)) return false;
        return EnumerableSingleVotersMap.get(_voters[pollHash], voter).voted;
    }

    uint256[49] private __gap;
}
