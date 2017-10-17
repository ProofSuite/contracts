pragma solidity ^0.4.15;

/// @dev The token controller contract must implement these functions
contract ControllerInterface {

    function proxyPayment(address _owner) payable returns(bool);
    function onTransfer(address _from, address _to, uint _amount) returns(bool);
    function onApprove(address _owner, address _spender, uint _amount) returns(bool);
}