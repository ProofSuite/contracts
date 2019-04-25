pragma solidity ^0.5.7;

/**
 * @title ProofPresaleToken (PROOFP)
 * Standard Mintable ERC20 Token
 * https://github.com/ethereum/EIPs/issues/20
 * Based on code by FirstBlood:
 * https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol
 */

contract ProofPresaleTokenInterface {

  uint256 public totalSupply;

  function balanceOf(address _owner) public view returns (uint256);
  function transfer(address _to, uint _value) public returns (bool);
  function transferFrom(address _from, address _to, uint _value) public returns (bool);
  function approve(address _spender, uint _value) public returns (bool);
  function allowance(address _owner, address _spender) public view returns (uint256);
  function mint(address _to, uint256 _amount) public returns (bool);
  function finishMinting() public returns (bool);

}
