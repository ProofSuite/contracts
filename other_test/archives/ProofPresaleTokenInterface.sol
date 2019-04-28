pragma solidity ^0.4.15;

/**
 * @title ProofPresaleToken (PROOFP)
 * Standard Mintable ERC20 Token
 * https://github.com/ethereum/EIPs/issues/20
 * Based on code by FirstBlood:
 * https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol
 */

contract ProofPresaleTokenInterface {

  uint256 public totalSupply;

  function balanceOf(address _owner) constant returns (uint256);
  function transfer(address _to, uint _value) returns (bool);
  function transferFrom(address _from, address _to, uint _value) returns (bool);
  function approve(address _spender, uint _value) returns (bool);
  function allowance(address _owner, address _spender) constant returns (uint256);
  function mint(address _to, uint256 _amount) returns (bool);
  function finishMinting() returns (bool);

}