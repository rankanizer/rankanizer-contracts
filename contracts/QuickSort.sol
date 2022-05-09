pragma solidity ^0.8.3;

contract QuickSort {
    
   function sort(uint256[] memory data, uint256[] memory ref) public returns (uint256[] memory) {
        _quickSort(data, ref, int256(0), int256(data.length - 1));
        return ref;
    }

    function _quickSort(
        uint256[] memory arr,
        uint256[] memory ref,
        int256 left,
        int256 right
    ) internal {
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
        if (left < j) _quickSort(arr, ref, left, j);
        if (i < right) _quickSort(arr, ref, i, right);
    }
}