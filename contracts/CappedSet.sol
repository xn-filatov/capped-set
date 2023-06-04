// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract CappedSet {
    address[] public addresses;

    uint256 public limit;
    mapping(address => uint) public addressToValue;

    constructor(uint _numElements) payable {
        require(
            _numElements > 1,
            "There should be more then 1 elements in the set"
        );

        limit = _numElements;
    }

    function insert(
        address addr,
        uint256 value
    ) public returns (address, uint256) {
        require(value > 0, "Value must be greater then zero");
        require(addressToValue[addr] == 0, "Address was inserted already");

        addresses.push(addr);
        addressToValue[addr] = value;

        // If its the first element to be inserted
        if (addresses.length == 1) return (address(0), 0);

        if (addresses.length > limit) {
            // If the limit is reached remove the smallest element
            (address lowestAddress, ) = getLowestSet();
            remove(lowestAddress);
        }

        return getLowestSet();
    }

    function update(
        address addr,
        uint256 newVal
    ) public returns (address, uint256) {
        require(addressToValue[addr] > 0, "Address should be set");

        addressToValue[addr] = newVal;

        return getLowestSet();
    }

    function remove(
        address addr
    ) public returns (address newLowestAddress, uint256 newLowestValue) {
        require(addressToValue[addr] > 0, "Address should be set");

        // Getting index of the address to remove from the array
        uint256 index;
        for (uint256 i = 0; i < addresses.length; i++)
            if (addresses[i] == addr) index = i;

        //Removing the address
        addresses[index] = addresses[addresses.length - 1];
        addresses.pop();

        // Removing the addresses value
        addressToValue[addr] = 0;

        return getLowestSet();
    }

    function getValue(address addr) public view returns (uint256) {
        require(addressToValue[addr] > 0, "Address should be set");
        return addressToValue[addr];
    }

    function getLowestSet() private view returns (address, uint256) {
        if (addresses.length == 0) return (address(0), 0);

        address lowestAddress = addresses[0];
        uint256 lowestValue = addressToValue[addresses[0]];
        for (uint256 i = 0; i < addresses.length; i++) {
            address checkAddress = addresses[i];
            uint256 checkValue = addressToValue[checkAddress];

            if (checkValue < lowestValue) {
                lowestValue = checkValue;
                lowestAddress = addresses[i];
            }
        }

        return (lowestAddress, lowestValue);
    }
}
