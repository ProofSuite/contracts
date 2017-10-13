pragma solidity ^0.4.14;

import './Controllable.sol';

/**
 * @title ProofToken (PRFT)
 * Standard Mintable ERC20 Token
 * https://github.com/ethereum/EIPs/issues/20
 * Based on code by FirstBlood:
 * https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol
 */
contract ProofTokenInterface is Controllable {

  event Mint(address indexed to, uint256 amount);
  event MintFinished();
  event ClaimedTokens(address indexed _token, address indexed _owner, uint _amount);
  event NewCloneToken(address indexed _cloneToken, uint _snapshotBlock);
  event Approval(address indexed _owner, address indexed _spender, uint256 _amount);
  event Transfer(address indexed from, address indexed to, uint256 value);

  function totalSupply() constant returns (uint);
  function totalSupplyAt(uint _blockNumber) constant returns(uint);
  function balanceOf(address _owner) constant returns (uint256 balance);
  function balanceOfAt(address _owner, uint _blockNumber) constant returns (uint);
  function transfer(address _to, uint256 _amount) returns (bool success);
  function transferFrom(address _from, address _to, uint256 _amount) returns (bool success);
  function doTransfer(address _from, address _to, uint _amount) internal returns(bool);
  function approve(address _spender, uint256 _amount) returns (bool success);
  function approveAndCall(address _spender, uint256 _amount, bytes _extraData) returns (bool success);
  function allowance(address _owner, address _spender) constant returns (uint256 remaining);
  function mint(address _owner, uint _amount) returns (bool);
  function importPresaleBalances(address[] _addresses, uint256[] _balances, address _presaleAddress) returns (bool);
  function lockPresaleBalances() returns (bool);
  function finishMinting() returns (bool);
  function enableTransfers(bool _transfersEnabled);
  function createCloneToken(uint _snapshotBlock, string _cloneTokenName, string _cloneTokenSymbol) returns (address);

}