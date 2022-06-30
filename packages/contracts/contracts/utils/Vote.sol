// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

library Vote {
    uint256 constant _BITS_PER_CANDIDATE = 5;
    uint256 constant _BITMASK = (2**_BITS_PER_CANDIDATE) - 1;

    // Storage Layout:
    // Voter (160bit) | size (5bit) | votes (5~90bit)
    struct Encoded {
        uint256 data;
    }

    struct Decoded {
        address voter;
        uint256[] rank;
    }

    function encode(Decoded memory decoded) internal pure returns (Encoded memory encoded) {
        unchecked {
            require(decoded.rank.length <= 18, "number of candidates exceed the limit");
            // Encode vote address
            uint256 encodedVote = uint256(uint160(decoded.voter)) << 96;

            // Encode number of candidates
            uint256 size = decoded.rank.length;
            encodedVote |= size << 91;

            // Encode votes
            for (uint256 i = 0; i < size; i++) {
                encodedVote |= (decoded.rank[i] << (_BITS_PER_CANDIDATE * i));
            }
            encoded.data = encodedVote;
        }
    }

    function decode(Encoded memory encoded) internal pure returns (Decoded memory decoded) {
        unchecked {
            uint256 encodedVote = encoded.data;
            decoded.voter = address(uint160(encodedVote >> 96));
            uint256 size = (encodedVote >> 91) & _BITMASK;
            decoded.rank = new uint256[](size);
            for (uint256 i = 0; i < size; i++) {
                decoded.rank[i] = encodedVote & _BITMASK;
                encodedVote >>= _BITS_PER_CANDIDATE;
            }
        }
    }
}
