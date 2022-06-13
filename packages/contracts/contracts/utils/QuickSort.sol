// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.3;

/**
 * @dev A quicksort implementation that uses only memory
 */
library QuickSort {
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

        _quickSortRef(data, ref, int256(0), int256(data.length - 1));
    }

    function _quickSortRef(
        uint256[] memory arr,
        uint256[] memory ref,
        int256 left,
        int256 right
    ) private pure {
        int256 i = left;
        int256 j = right;
        uint256 pivot = arr[ref[uint256(left + (right - left) / 2)]];
        while (i <= j) {
            while (arr[ref[uint256(i)]] > pivot) i++;
            while (pivot > arr[ref[uint256(j)]]) j--;
            if (i <= j) {
                (ref[uint256(i)], ref[uint256(j)]) = (ref[uint256(j)], ref[uint256(i)]);
                i++;
                j--;
            }
        }
        if (left < j) _quickSortRef(arr, ref, left, j);
        if (i < right) _quickSortRef(arr, ref, i, right);
    }
}
