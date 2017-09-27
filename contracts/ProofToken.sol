pragma solidity ^0.4.13;

import './SafeMath.sol';
import './ERC20.sol';
import './Ownable.sol';
import './ProofPresaleToken.sol';

/**
 * @title ProofToken (PRFT)
 * Standard Mintable ERC20 Token
 * https://github.com/ethereum/EIPs/issues/20
 * Based on code by FirstBlood:
 * https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol
 */
contract ProofToken is ERC20, Ownable {

  using SafeMath for uint256;

  ProofPresaleToken public presaleToken;

  address public proofTokenWallet;
  mapping(address => uint) balances;
  mapping (address => mapping (address => uint)) allowed;

  string public constant name = "Proof Token";
  string public constant symbol = "PRFT";
  uint8 public constant decimals = 18;

  bool public mintingFinished = false;
  bool public presaleBalancesImported = false;
  bool public presaleBalancesLocked = false;

  uint256 public constant TOKENS_ALLOCATED_TO_PROOF = 1181031 * (10 ** 18);

  event Mint(address indexed to, uint256 amount);
  event MintFinished();

  function ProofToken() {

    proofTokenWallet = 0xE2b3204F29Ab45d5fd074Ff02aDE098FbC381D42;
    balances[proofTokenWallet] = balances[proofTokenWallet].add(TOKENS_ALLOCATED_TO_PROOF);
    totalSupply = totalSupply.add(TOKENS_ALLOCATED_TO_PROOF);
  }

  function() payable {
    revert();
  }

  function balanceOf(address _owner) constant returns (uint256) {
    return balances[_owner];
  }

  function transfer(address _to, uint _value) returns (bool) {

    balances[msg.sender] = balances[msg.sender].sub(_value);
    balances[_to] = balances[_to].add(_value);

    Transfer(msg.sender, _to, _value);
    return true;
  }

  function transferFrom(address _from, address _to, uint _value) returns (bool) {
    var _allowance = allowed[_from][msg.sender];

    balances[_to] = balances[_to].add(_value);
    balances[_from] = balances[_from].sub(_value);
    allowed[_from][msg.sender] = _allowance.sub(_value);

    Transfer(_from, _to, _value);
    return true;
  }

  function approve(address _spender, uint _value) returns (bool) {
    allowed[msg.sender][_spender] = _value;

    Approval(msg.sender, _spender, _value);
    return true;
  }

  function allowance(address _owner, address _spender) constant returns (uint256) {
    return allowed[_owner][_spender];
  }

  function mint(address _to, uint256 _amount) onlyOwner canMint returns (bool) {
    totalSupply = totalSupply.add(_amount);
    balances[_to] = balances[_to].add(_amount);

    Mint(_to, _amount);
    return true;
  }

  modifier canMint() {
    require(!mintingFinished);
    _;
  }


  /**
   * Import presale balances before the start of the token sale. After importing
   * balances, lockPresaleBalances() has to be called to prevent further modification
   * of presale balances.
   * @param _addresses Array of presale addresses
   * @param _balances Array of balances corresponding to presale addresses.
   * @param _presaleAddress To import the presale token total supply
   * @return A boolean that indicates if the operation was successful.
   */
  function importPresaleBalances(address[] _addresses, uint256[] _balances, address _presaleAddress) onlyOwner returns (bool) {
    require(presaleBalancesLocked == false);
    ProofPresaleToken presale = ProofPresaleToken(_presaleAddress);

    for (uint256 i = 0; i < _addresses.length; i++) {
      balances[_addresses[i]] = _balances[i];
    }

    totalSupply = presale.totalSupply();
    presaleBalancesImported = true;
    return true;
  }

  /**
   * Lock presale balances after successful presale balance import
   * @return A boolean that indicates if the operation was successful.
   */
  function lockPresaleBalances() onlyOwner returns (bool) {
    require(presaleBalancesImported == true);
    presaleBalancesLocked = true;
    return true;
  }

  function finishMinting() onlyOwner returns (bool) {
    mintingFinished = true;
    MintFinished();
    return true;
  }
}