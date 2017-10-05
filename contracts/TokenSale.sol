pragma solidity ^0.4.13;

import './SafeMath.sol';
import './ProofToken.sol';
import './Pausable.sol';

/**
 * @title Tokensale
 * Tokensale allows investors to make token purchases and assigns them tokens based
 * on a token per ETH rate. Funds collected are forwarded to a wallet as they arrive.
 */
contract TokenSale is Pausable {

  using SafeMath for uint256;

  ProofToken public proofToken;
  address public wallet;
  uint256 public weiRaised;
  uint256 public cap;
  uint256 public rate;
  uint256 public priceInWei;
  uint256 public decimalsMultiplier;
  uint256 public initialSupply;
  uint256 public startBlock;
  uint256 public endBlock;
  address public proofWallet;
  bool public finalized;

  uint256 public constant TOTAL_TOKENS = 2 * 1181031 * (10 ** 18);
  uint256 public constant PUBLIC_TOKENS = 1181031 * (10 ** 18);
  uint256 public constant TOKENS_ALLOCATED_TO_PROOF = 1181031 * (10 ** 18);

  /**
   * event for token purchase logging
   * @param purchaser who paid for the tokens
   * @param beneficiary who got the tokens
   * @param value weis paid for purchase
   * @param amount amount of tokens purchased
   */
  event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);

  /**
   * event for signaling finished crowdsale
   */
  event Finalized();

  function TokenSale(
    address _wallet,
    address _tokenAddress,
    uint256 _startBlock,
    uint256 _endBlock){
    require(_wallet != 0x0);
    require(_tokenAddress != 0x0);
    require(_startBlock > 0);
    require(_endBlock > _startBlock);

    wallet = _wallet;
    startBlock = _startBlock;
    endBlock = _endBlock;
    proofToken = ProofToken(_tokenAddress);

    uint256 allocatedTokens = proofToken.totalSupply();
    uint256 remainingTokens = TOTAL_TOKENS - allocatedTokens;


    priceInWei = 88000000000000000;
    decimalsMultiplier = (10 ** 18);
    cap = remainingTokens / (10 ** 18);
  }


  /**
   * High level token purchase function
   */
  function() payable {
    buyTokens(msg.sender);
  }

  /**
   * Low level token purchase function
   * @param beneficiary will recieve the tokens.
   */
  function buyTokens(address beneficiary) payable whenNotPaused whenNotFinalized {
    require(beneficiary != 0x0);
    require(validPurchase());

    uint256 weiAmount = msg.value;
    weiRaised = weiRaised.add(weiAmount);
    uint256 tokens = weiAmount.mul(decimalsMultiplier).div(priceInWei);

    proofToken.mint(beneficiary, tokens);
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);
    forwardFunds();
  }


  function forwardFunds() internal {
    wallet.transfer(msg.value);
  }

  function validPurchase() internal returns (bool) {
    uint256 current = block.number;
    bool withinPeriod = current >= startBlock && current <= endBlock;
    uint256 weiAmount = weiRaised.add(msg.value);
    bool nonZeroPurchase = msg.value != 0;
    bool withinCap = cap.mul(priceInWei) >= weiAmount;
    return withinCap && nonZeroPurchase && withinPeriod;
  }


  function totalSupply() public constant returns (uint256) {
    return proofToken.totalSupply();
  }

  function balanceOf(address _owner) public constant returns (uint256) {
    return proofToken.balanceOf(_owner);
  }

  //controller interface

  function proxyPayment(address _owner) payable public {
    revert();
  }

  function onTransfer(address _from, address _to, uint _amount) public returns (bool) {
    return true;
  }

  function onApprove(address _owner, address _spender, uint _amount) public returns (bool) {
    // No approve/transferFrom during the sale
    return false;
  }


  /**
  @dev Not sure if this function is actually effective. From my understanding, the number of wei
  @dev raised needs to be exactly equal to the cap which is probably never going to be reached
  @dev exactly. Maybe better to just remove this function ?
   */
  function finalize() onlyOwner {
    require(paused);

    proofToken.finishMinting();
    Finalized();

    finalized = true;
  }

  modifier whenNotFinalized() {
    require(!paused);
    _;
  }

}