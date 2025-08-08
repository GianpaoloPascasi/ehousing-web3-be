// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Burnable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

struct HouseRentalInfo {
    uint dateFrom;
    uint dateTo;
}

event HouseCreated(uint256 tokenId, string uri);
event HouseMinted(uint256 tokenId, address tempOwner);

contract Ehousing is ERC721, ERC721URIStorage, ERC721Burnable, Ownable {
    uint256 private _nextTokenId;
    mapping(uint256 => HouseRentalInfo) private _rentals;
    uint public test;
    address public _initialOwner;

    constructor(
        address initialOwner
    ) ERC721("Ehousing", "EHSW3") Ownable(initialOwner) {
        _initialOwner = initialOwner;
    }

    function createHouse(string memory uri) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _setTokenURI(tokenId, uri);
        emit HouseCreated(tokenId, uri);
        return tokenId;
    }

    function mintHouse(
        address to,
        uint256 tokenId,
        uint dateFrom,
        uint dateTo
    ) public onlyOwner {
        _safeMint(to, tokenId);
        _rentals[tokenId] = HouseRentalInfo(dateFrom, dateTo);
        emit HouseMinted(tokenId, to);
    }

    function getRentalInfo(
        uint256 tokenId
    ) public view returns (HouseRentalInfo memory) {
        return _rentals[tokenId];
    }

    function isValidRental(uint256 tokenId) public view returns (bool) {
        return
            block.timestamp >= _rentals[tokenId].dateFrom &&
            block.timestamp <= _rentals[tokenId].dateTo;
    }

    modifier _isValidRental(uint256 tokenId) {
        require(isValidRental(tokenId), "Rental not valid anymore");
        _;
    }

    modifier _isInvalidRental(uint256 tokenId) {
        require(!isValidRental(tokenId), "Rental is still valid");
        _;
    }

    // takes back the token representing the rental from the temporary owner
    function retakeOwnership(
        uint256 tokenId
    ) public onlyOwner _isInvalidRental(tokenId) {
        _safeTransfer(ownerOf(tokenId), msg.sender, tokenId);
    }

    // takes back forcibly the token representing the rental from the temporary owner eg when rental is cancelled
    function retakeOwnershipForced(uint256 tokenId) public onlyOwner {
        _safeTransfer(ownerOf(tokenId), msg.sender, tokenId);
    }

    modifier onlyRentalOwner(uint256 tokenId) {
        require(
            super.ownerOf(tokenId) == msg.sender,
            "You are not renting this home!"
        );
        require(msg.sender != _initialOwner, "You are the contract owner, use retakeOwnership or retakeOwnershipForced!");
        _;
    }

    function giveBack(uint256 tokenId) public onlyRentalOwner(tokenId) {
        _safeTransfer(msg.sender, _initialOwner, tokenId);
    }

    // The following functions are overrides required by Solidity.

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
