pragma solidity ^0.4.15;

import './SafeMath.sol';
import './Pausable.sol';
import './ProofTokenInterface.sol';
/**
 * @title Tokensale
 * Tokensale allows investors to make token purchases and assigns them tokens based

 * on a token per ETH rate. Funds collected are forwarded to a wallet as they arrive.
 */
contract TokenSale is Pausable {

  using SafeMath for uint256;

  ProofTokenInterface public proofToken;
  uint256 public totalWeiRaised;
  uint256 public tokensMinted;
  uint256 public totalSupply;
  uint256 public contributors;
  uint256 public decimalsMultiplier;
  uint256 public startBlock;
  uint256 public endBlock;
  uint256 public remainingTokens;
  uint256 public allocatedTokens;
  bool public finalized;

  uint256 public constant BASE_PRICE_IN_WEI = 88000000000000000;

  uint256 public constant PUBLIC_TOKENS = 1181031 * (10 ** 18);
  uint256 public constant TOTAL_PRESALE_TOKENS = 112386712924725508802400;
  uint256 public constant TOKENS_ALLOCATED_TO_PROOF = 1181031 * (10 ** 18);

  address public constant PROOF_MULTISIG = 0x11e3de1bdA2650fa6BC74e7Cea6A39559E59b103;
  address public constant PROOF_TOKEN_WALLET = 0x11e3de1bdA2650fa6BC74e7Cea6A39559E59b103;

  uint256 public tokenCap = PUBLIC_TOKENS - TOTAL_PRESALE_TOKENS;
  uint256 public cap = tokenCap / (10 ** 18);
  uint256 public weiCap = cap * BASE_PRICE_IN_WEI;

  uint256 public firstCheckpointPrice = (BASE_PRICE_IN_WEI * 85) / 100;
  uint256 public secondCheckpointPrice = (BASE_PRICE_IN_WEI * 90) / 100;
  uint256 public thirdCheckpointPrice = (BASE_PRICE_IN_WEI * 95) / 100;

  uint256 public firstCheckpoint = (weiCap * 5) / 100;
  uint256 public secondCheckpoint = (weiCap * 10) / 100;
  uint256 public thirdCheckpoint = (weiCap * 20) / 100;

  event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);
  event NewClonedToken(address indexed _cloneToken);
  event OnTransfer(address _from, address _to, uint _amount);
  event OnApprove(address _owner, address _spender, uint _amount);
  event LogInt(string _name, uint256 _value);
  event Finalized();

  function TokenSale(
    address _tokenAddress,
    uint256 _startBlock,
    uint256 _endBlock) {
    require(_tokenAddress != 0x0);
    require(_startBlock > 0);
    require(_endBlock > _startBlock);

    startBlock = _startBlock;
    endBlock = _endBlock;
    proofToken = ProofTokenInterface(_tokenAddress);

    decimalsMultiplier = (10 ** 18);
  }


  /**
   * High level token purchase function
   */
  function() payable {
    buyTokens(msg.sender);
  }

  /**
   * Low level token purchase function
   * @param _beneficiary will receive the tokens.
   */
  function buyTokens(address _beneficiary) payable whenNotPaused whenNotFinalized {
    require(_beneficiary != 0x0);
    require(validPurchase());

    uint256 weiAmount = msg.value;
    uint256 priceInWei = getPriceInWei();
    totalWeiRaised = totalWeiRaised.add(weiAmount);

    uint256 tokens = weiAmount.mul(decimalsMultiplier).div(priceInWei);
    tokensMinted = tokensMinted.add(tokens);
    require(tokensMinted < tokenCap);

    contributors = contributors.add(1);

    proofToken.mint(_beneficiary, tokens);
    TokenPurchase(msg.sender, _beneficiary, weiAmount, tokens);
    forwardFunds();
  }


  /**
   * Get the price in wei for current premium
   * @return price
   */
  function getPriceInWei() public returns (uint256) {

    uint256 price;

    if (totalWeiRaised < firstCheckpoint) {
      price = firstCheckpointPrice;
    } else if (totalWeiRaised < secondCheckpoint) {
      price = secondCheckpointPrice;
    } else if (totalWeiRaised < thirdCheckpoint) {
      price = thirdCheckpointPrice;
    } else {
      price = BASE_PRICE_IN_WEI;
    }

    return price;
  }

  /**
  * Forwards funds to the tokensale wallet
  */
  function forwardFunds() internal {
    PROOF_MULTISIG.transfer(msg.value);
  }


  /**
  * Validates the purchase (period, minimum amount, within cap)
  * @return {bool} valid
  */
  function validPurchase() internal returns (bool) {
    uint256 current = block.number;
    bool withinPeriod = current >= startBlock && current <= endBlock;
    bool nonZeroPurchase = msg.value != 0;

    return nonZeroPurchase && withinPeriod;
  }

  /**
  * Returns the total Proof token supply
  * @return total supply {uint256}
  */
  function totalSupply() public constant returns (uint256) {
    return proofToken.totalSupply();
  }

  /**
  * Returns token holder Proof Token balance
  * @param _owner {address}
  * @return token balance {uint256}
  */
  function balanceOf(address _owner) public constant returns (uint256) {
    return proofToken.balanceOf(_owner);
  }

  //controller interface

  // function proxyPayment(address _owner) payable public {
  //   revert();
  // }

  /**
  * Controller Interface transfer callback method
  * @param _from {address}
  * @param _to {address}
  * @param _amount {number}
  */
  function onTransfer(address _from, address _to, uint _amount) public returns (bool) {
    OnTransfer(_from, _to, _amount);
    return true;
  }

  /**
  * Controller Interface transfer callback method
  * @param _owner {address}
  * @param _spender {address}
  * @param _amount {number}
   */
  function onApprove(address _owner, address _spender, uint _amount) public returns (bool) {
    OnApprove(_owner, _spender, _amount);
    return true;
  }

  /**
  * Change the Proof Token controller
  * @param _newController {address}
  */
  function changeController(address _newController) public onlyOwner {
    proofToken.transferControl(_newController);
  }


  function enableTransfers(bool _transfersEnabled) public onlyOwner {
    proofToken.enableTransfers(_transfersEnabled);
  }

  /**
  * Allocates Proof tokens to the given Proof Token wallet
  * @param _tokens {uint256}
  */
  function allocateProofTokens(uint256 _tokens) public onlyOwner whenNotFinalized {
    proofToken.mint(PROOF_TOKEN_WALLET, _tokens);
  }

  /**
  * Finalize the token sale (can only be called by owner)
  */
  function finalize() onlyOwner {
    require(paused);

    proofToken.finishMinting();
    proofToken.enableTransfers(true);
    Finalized();

    finalized = true;
  }

  modifier whenNotFinalized() {
    require(!paused);
    _;
  }

}