// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.3;

library QuickSort {
    // Sort array based on a reference array
    function sortRef(uint256[] memory data, uint256[] memory ref) public pure returns (uint256[] memory) {
        _quickSortRef(data, ref, int256(0), int256(data.length - 1));
        return ref;
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

    // Sort array based on it's own values
    function sort(uint256[] memory data) public pure returns (uint256[] memory) {
        _quickSort(data, int256(0), int256(data.length - 1));
        return data;
    }

    function _quickSort(
        uint256[] memory arr,
        int256 left,
        int256 right
    ) private pure {
        int256 i = left;
        int256 j = right;
        uint256 pivot = arr[uint256(left + (right - left) / 2)];
        while (i <= j) {
            while (arr[uint256(i)] > pivot) i++;
            while (pivot > arr[uint256(j)]) j--;
            if (i <= j) {
                (arr[uint256(i)], arr[uint256(j)]) = (arr[uint256(j)], arr[uint256(i)]);
                i++;
                j--;
            }
        }
        if (left < j) _quickSort(arr, left, j);
        if (i < right) _quickSort(arr, i, right);
    }
}
