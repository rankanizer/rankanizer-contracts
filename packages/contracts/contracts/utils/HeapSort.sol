// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.3;

/**
 * @dev A heapsort implementation that uses only memory
 */
library HeapSort {
    /**
     * @dev Sort `ref` array using content from `data` array
     *
     * Requirements:
     *
     * - `data` cannot be empty.
     * - `ref` must have the same length as data.
     *
     */
    function sortRef(uint256[] memory data, uint256[] memory ref) internal pure {
        require(data.length == ref.length, "The arrays must have the same length");

        // Before sort the `ref` array content is the same as it's indexes
        for (uint256 i = 0; i < data.length; i++) {
            ref[i] = i;
        }

        heapsort(data, ref, int256(data.length));
    }

    function heapify(
        uint256[] memory data,
        uint256[] memory ref,
        int256 n,
        int256 i
    ) internal pure {
        // Initialize largest as root
        int256 largest = i;

        // left = 2*i + 1
        int256 l = 2 * largest + 1;

        // right = 2*i + 2
        int256 r = 2 * largest + 2;

        // See if left child of root exists and is
        // greater than root
        if (l < largest && data[ref[uint256(largest)]] < data[ref[uint256(l)]]) {
            largest = l;
        }

        // See if right child of root exists and is
        // greater than root
        if (r < largest && data[ref[uint256(largest)]] < data[ref[uint256(r)]]) {
            largest = r;
        }

        // Change root, if needed
        if (largest != i) {
            // Swap
            (ref[uint256(i)], ref[uint256(largest)]) = (ref[uint256(largest)], ref[uint256(i)]);

            // Heapify the root.
            heapify(data, ref, n, largest);
        }
    }

    function heapsort(
        uint256[] memory data,
        uint256[] memory ref,
        int256 n
    ) internal pure {
        // Build a maxheap.
        for (int256 i = n / 2; i > -1; i--) {
            heapify(data, ref, n, i);
        }

        // One by one extract elements
        for (int256 i = n - 1; i > 0; i--) {
            // Swap
            (ref[uint256(i)], ref[uint256(0)]) = (ref[uint256(0)], ref[uint256(i)]);
            heapify(data, ref, i, 0);
        }
    }
}
