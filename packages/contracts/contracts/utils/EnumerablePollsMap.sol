// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.3;

import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";

/**
 * @dev Library for managing an upgradeable enumerable map of accounts
 *
 * Maps have the following properties:
 *
 * - Entries are added, removed, and checked for existence in constant time
 * (O(1)).
 * - Entries are enumerated in O(n). No guarantees are made on the ordering.
 *
 * ```
 * contract Example {
 *     // Add the library methods
 *     using EnumerablePollsMap for EnumerablePollsMap.Map;
 *
 *     // Declare a set state variable
 *     EnumerablePollsMap.Map private polls;
 * }
 * ```
 */
library EnumerablePollsMap {
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.Bytes32Set;

    struct Poll {
        // List of candidates
        uint256 candidates;
        // Votes for each candidate
        uint256[] votes;
        // Expiration block
        uint256 expire;
        // Poll closed
        bool finished;
        // Poll Owner's address
        address owner;
        //Candidates uri
        string uri;
    }

    // Maps an Address to Voter
    struct Map {
        // Storage of keys
        EnumerableSetUpgradeable.Bytes32Set _keys;
        mapping(bytes32 => Poll) _values;
    }

    /**
     * @dev Adds a key-value pair to a map, or updates the value for an existing
     * key. O(1).
     *
     * Returns true if the key was added to the map, that is if it was not
     * already present.
     */
    function set(
        Map storage map,
        bytes32 key,
        Poll memory value
    ) internal returns (bool) {
        map._values[key] = value;
        return map._keys.add(key);
    }

    /**
     * @dev Removes a key-value pair from a map. O(1).
     *
     * Returns true if the key was removed from the map, that is if it was present.
     */
    function remove(Map storage map, bytes32 key) internal returns (bool) {
        delete map._values[key];
        return map._keys.remove(key);
    }

    /**
     * @dev Returns true if the key is in the map. O(1).
     */
    function contains(Map storage map, bytes32 key) internal view returns (bool) {
        return map._keys.contains(key);
    }

    /**
     * @dev Returns the number of key-value pairs in the map. O(1).
     */
    function length(Map storage map) internal view returns (uint256) {
        return map._keys.length();
    }

    /**
     * @dev Returns the key-value pair stored at position `index` in the map. O(1).
     *
     * Note that there are no guarantees on the ordering of entries inside the
     * array, and it may change when more entries are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function at(Map storage map, uint256 index) internal view returns (bytes32, Poll storage) {
        bytes32 key = map._keys.at(index);
        return (key, map._values[key]);
    }

    /**
     * @dev Returns the value associated with `key`.  O(1).
     *
     * Requirements:
     *
     * - `key` must be in the map.
     */
    function get(Map storage map, bytes32 key) internal view returns (Poll storage) {
        require(contains(map, key), "EnumerablePollMap: poll doesn't exists");
        return map._values[key];
    }

    /**
     * @dev Returns the value associated with `key`.  O(1).
     */
    function getUnchecked(Map storage map, bytes32 key) internal view returns (Poll storage) {
        return map._values[key];
    }
}
