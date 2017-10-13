pragma solidity ^0.4.14;

import './SafeMath.sol';
import './Controllable.sol';
import './CallFallback.sol';
import './ControllerInterface.sol';
import './ProofPresaleTokenInterface.sol';
import './TokenFactoryInterface.sol';
import './ProofTokenInterface.sol';

/**
 * @title ProofToken (PRFT)
 * Standard Mintable ERC20 Token
 * https://github.com/ethereum/EIPs/issues/20
 * Based on code by FirstBlood:
 * https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol
 */
contract ProofToken is Controllable {

  using SafeMath for uint256;
  ProofTokenInterface public parentToken;
  TokenFactoryInterface public tokenFactory;
  ProofPresaleTokenInterface public presale;

  string public name;
  string public symbol;
  uint8 public decimals;

  struct Checkpoint {
    uint128 fromBlock;
    uint128 value;
  }

  uint256 public parentSnapShotBlock;
  uint256 public creationBlock;
  bool public transfersEnabled;

  mapping(address => Checkpoint[]) balances;
  mapping (address => mapping (address => uint)) allowed;

  Checkpoint[] totalSupplyHistory;

  bool public mintingFinished = false;
  bool public presaleBalancesLocked = false;

  uint256 public constant TOKENS_ALLOCATED_TO_PROOF = 1181031 * (10 ** 18);

  event Mint(address indexed to, uint256 amount);
  event MintFinished();
  event ClaimedTokens(address indexed _token, address indexed _owner, uint _amount);
  event NewCloneToken(address indexed _cloneToken, uint _snapshotBlock);
  event Approval(address indexed _owner, address indexed _spender, uint256 _amount);
  event Transfer(address indexed from, address indexed to, uint256 value);


  function ProofToken(
    address _tokenFactory,
    address _parentToken,
    uint256 _parentSnapShotBlock,
    string _tokenName,
    string _tokenSymbol
    ) {
      tokenFactory = TokenFactoryInterface(_tokenFactory);
      parentToken = ProofTokenInterface(_parentToken);
      parentSnapShotBlock = _parentSnapShotBlock;
      name = _tokenName;
      symbol = _tokenSymbol;
      decimals = 18;
      transfersEnabled = true;
      creationBlock = block.number;

  }

  function() payable {
    revert();
  }

  function totalSupply() constant returns (uint) {
    return totalSupplyAt(block.number);
  }

  function totalSupplyAt(uint _blockNumber) constant returns(uint) {
    // These next few lines are used when the totalSupply of the token is
    //  requested before a check point was ever created for this token, it
    //  requires that the `parentToken.totalSupplyAt` be queried at the
    //  genesis block for this token as that contains totalSupply of this
    //  token at this block number.
    if ((totalSupplyHistory.length == 0) || (totalSupplyHistory[0].fromBlock > _blockNumber)) {
        if (address(parentToken) != 0) {
            return parentToken.totalSupplyAt(min(_blockNumber, parentSnapShotBlock));
        } else {
            return 0;
        }

    // This will return the expected totalSupply during normal situations
    } else {
        return getValueAt(totalSupplyHistory, _blockNumber);
    }
  }

  function balanceOf(address _owner) constant returns (uint256 balance) {
    return balanceOfAt(_owner, block.number);
  }

  function balanceOfAt(address _owner, uint _blockNumber) constant returns (uint) {
    // These next few lines are used when the balance of the token is
    //  requested before a check point was ever created for this token, it
    //  requires that the `parentToken.balanceOfAt` be queried at the
    //  genesis block for that token as this contains initial balance of
    //  this token
    if ((balances[_owner].length == 0) || (balances[_owner][0].fromBlock > _blockNumber)) {
        if (address(parentToken) != 0) {
            return parentToken.balanceOfAt(_owner, min(_blockNumber, parentSnapShotBlock));
        } else {
            // Has no parent
            return 0;
        }

    // This will return the expected balance during normal situations
    } else {
        return getValueAt(balances[_owner], _blockNumber);
    }
  }

  function transfer(address _to, uint256 _amount) returns (bool success) {
    require(transfersEnabled);
    return doTransfer(msg.sender, _to, _amount);
  }

  function transferFrom(address _from, address _to, uint256 _amount) returns (bool success) {
    require(transfersEnabled);
    require(allowed[_from][msg.sender] >= _amount);
    allowed[_from][msg.sender] -= _amount;
    return doTransfer(_from, _to, _amount);
  }

  function doTransfer(address _from, address _to, uint _amount) internal returns(bool) {
    require(_amount > 0);
    require(parentSnapShotBlock < block.number);
    require((_to != 0) && (_to != address(this)));

    // If the amount being transfered is more than the balance of the
    //  account the transfer returns false
    var previousBalanceFrom = balanceOfAt(_from, block.number);
    require(previousBalanceFrom >= _amount);

    // Alerts the token controller of the transfer
    if (isContract(controller)) {
      require(ControllerInterface(controller).onTransfer(_from, _to, _amount));
    }

    // First update the balance array with the new value for the address
    //  sending the tokens
    updateValueAtNow(balances[_from], previousBalanceFrom - _amount);

    // Then update the balance array with the new value for the address
    //  receiving the tokens
    var previousBalanceTo = balanceOfAt(_to, block.number);
    require(previousBalanceTo + _amount >= previousBalanceTo); // Check for overflow
    updateValueAtNow(balances[_to], previousBalanceTo + _amount);

    // An event to make the transfer easy to find on the blockchain
    Transfer(_from, _to, _amount);
    return true;
  }

  function approve(address _spender, uint256 _amount) returns (bool success) {
    require(transfersEnabled);

    // To change the approve amount you first have to reduce the addresses`
    //  allowance to zero by calling `approve(_spender,0)` if it is not
    //  already 0 to mitigate the race condition described here:
    //  https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
    require((_amount == 0) || (allowed[msg.sender][_spender] == 0));

    // Alerts the token controller of the approve function call
    if (isContract(controller)) {
        require(ControllerInterface(controller).onApprove(msg.sender, _spender, _amount));
    }

    allowed[msg.sender][_spender] = _amount;
    Approval(msg.sender, _spender, _amount);
    return true;
  }

  function approveAndCall(address _spender, uint256 _amount, bytes _extraData) returns (bool success) {
    require(approve(_spender, _amount));
    CallFallback(_spender).receiveApproval(
        msg.sender,
        _amount,
        this,
        _extraData
    );

    return true;
  }

  function allowance(address _owner, address _spender) constant returns (uint256 remaining) {
    return allowed[_owner][_spender];
  }

  function mint(address _owner, uint _amount) onlyController canMint returns (bool) {
    uint curTotalSupply = totalSupply();
    require(curTotalSupply + _amount >= curTotalSupply); // Check for overflow
    uint previousBalanceTo = balanceOf(_owner);
    require(previousBalanceTo + _amount >= previousBalanceTo); // Check for overflow
    updateValueAtNow(totalSupplyHistory, curTotalSupply + _amount);
    updateValueAtNow(balances[_owner], previousBalanceTo + _amount);
    Transfer(0, _owner, _amount);
    return true;
  }

  /// @notice Burns `_amount` tokens from `_owner`
  /// @param _owner The address that will lose the tokens
  /// @param _amount The quantity of tokens to burn
  /// @return True if the tokens are burned correctly
  function burn(address _owner, uint _amount) onlyController returns (bool) {
      uint curTotalSupply = totalSupply();
      require(curTotalSupply >= _amount);
      uint previousBalanceFrom = balanceOf(_owner);
      require(previousBalanceFrom >= _amount);
      updateValueAtNow(totalSupplyHistory, curTotalSupply - _amount);
      updateValueAtNow(balances[_owner], previousBalanceFrom - _amount);
      Transfer(_owner, 0, _amount);
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
  function importPresaleBalances(address[] _addresses, uint256[] _balances, address _presaleAddress, address _proofTokenWallet) onlyController returns (bool) {
    require(presaleBalancesLocked == false);


    for (uint256 i = 0; i < _addresses.length; i++) {
      updateValueAtNow(balances[_addresses[i]], _balances[i]);
      Transfer(0, _addresses[i], _balances[i]);
    }

    updateValueAtNow(balances[_proofTokenWallet], TOKENS_ALLOCATED_TO_PROOF);

    presale = ProofPresaleTokenInterface(_presaleAddress);
    updateValueAtNow(totalSupplyHistory, TOKENS_ALLOCATED_TO_PROOF + presale.totalSupply());
    return true;
  }

  /**
   * Lock presale balances after successful presale balance import
   * @return A boolean that indicates if the operation was successful.
   */
  function lockPresaleBalances() onlyController returns (bool) {
    presaleBalancesLocked = true;
    return true;
  }

  function finishMinting() onlyController returns (bool) {
    mintingFinished = true;
    MintFinished();
    return true;
  }

  function enableTransfers(bool _transfersEnabled) onlyController {
      transfersEnabled = _transfersEnabled;
  }

  function getValueAt(Checkpoint[] storage checkpoints, uint _block) constant internal returns (uint) {

      if (checkpoints.length == 0)
        return 0;
      // Shortcut for the actual value
      if (_block >= checkpoints[checkpoints.length-1].fromBlock)
        return checkpoints[checkpoints.length-1].value;
      if (_block < checkpoints[0].fromBlock)
        return 0;

      // Binary search of the value in the array
      uint min = 0;
      uint max = checkpoints.length-1;
      while (max > min) {
          uint mid = (max + min + 1) / 2;
          if (checkpoints[mid].fromBlock<=_block) {
              min = mid;
          } else {
              max = mid-1;
          }
      }
      return checkpoints[min].value;
  }

  function updateValueAtNow(Checkpoint[] storage checkpoints, uint _value
  ) internal
  {
      if ((checkpoints.length == 0) || (checkpoints[checkpoints.length-1].fromBlock < block.number)) {
              Checkpoint storage newCheckPoint = checkpoints[checkpoints.length++];
              newCheckPoint.fromBlock = uint128(block.number);
              newCheckPoint.value = uint128(_value);
          } else {
              Checkpoint storage oldCheckPoint = checkpoints[checkpoints.length-1];
              oldCheckPoint.value = uint128(_value);
          }
  }

  function isContract(address _addr) constant internal returns(bool) {
      uint size;
      if (_addr == 0)
        return false;
      assembly {
          size := extcodesize(_addr)
      }
      return size>0;
  }

  /// @dev Helper function to return a min betwen the two uints
  function min(uint a, uint b) internal returns (uint) {
      return a < b ? a : b;
  }

  function createCloneToken(
        uint _snapshotBlock,
        string _cloneTokenName,
        string _cloneTokenSymbol
        ) onlyController returns(address)
     {

      if (_snapshotBlock == 0) {
        _snapshotBlock = block.number;
      }

      ProofToken cloneToken = tokenFactory.createCloneToken(
          this,
          _snapshotBlock,
          _cloneTokenName,
          _cloneTokenSymbol
        );

      cloneToken.transferControl(msg.sender);

      // An event to make the token easy to find on the blockchain
      NewCloneToken(address(cloneToken), _snapshotBlock);
      return address(cloneToken);
    }

}