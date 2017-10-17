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
  address public wallet;
  uint256 public weiRaised;
  uint256 public rate;
  uint256 public decimalsMultiplier;
  uint256 public startBlock;
  uint256 public endBlock;
  uint256 public remainingTokens;
  uint256 public allocatedTokens;
  bool public finalized;

  uint256 public constant BASE_PRICE_IN_WEI = 88000000000000000;

  uint256 public constant TOTAL_TOKENS = 2 * 1181031 * (10 ** 18);
  uint256 public constant PUBLIC_TOKENS = 1181031 * (10 ** 18);
  uint256 public constant TOTAL_PRESALE_TOKENS = 112386712924725508802400;
  uint256 public constant TOKENS_ALLOCATED_TO_PROOF = 1181031 * (10 ** 18);

  address public constant PROOF_MULTISIG = 0x9fBDaAc5FaF6711F38Ab26541B7c0D72cB2C0e11;
  address public constant PROOF_TOKEN_WALLET = 0x9fBDaAc5FaF6711F38Ab26541B7c0D72cB2C0e11;


  uint256 public tokenCap = PUBLIC_TOKENS - TOTAL_PRESALE_TOKENS;
  uint256 public cap = tokenCap / (10 ** 18);
  uint256 public weiCap = cap * BASE_PRICE_IN_WEI;

  uint256 public firstCheckpointPrice = (BASE_PRICE_IN_WEI * 80) / 100;
  uint256 public secondCheckpointPrice = (BASE_PRICE_IN_WEI * 90) / 100;
  uint256 public thirdCheckpointPrice = (BASE_PRICE_IN_WEI * 95) / 100;

  uint256 public firstCheckpoint = (weiCap * 5) / 100;
  uint256 public secondCheckpoint = (weiCap * 10) / 100;
  uint256 public thirdCheckpoint = (weiCap * 15) / 100;

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
   * @param beneficiary will receive the tokens.
   */
  function buyTokens(address beneficiary) payable whenNotPaused whenNotFinalized {
    require(beneficiary != 0x0);
    require(validPurchase());

    uint256 weiAmount = msg.value;
    uint256 priceInWei = getPriceInWei();
    uint256 tokens = weiAmount.mul(decimalsMultiplier).div(priceInWei);

    weiRaised = weiRaised.add(weiAmount);
    proofToken.mint(beneficiary, tokens);

    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);
    forwardFunds();
  }


  /**
   * Get the price in wei for current premium
   * @return price
   */
  function getPriceInWei() public returns (uint256) {

    uint256 price;

    if (weiRaised < firstCheckpoint) {
      price = firstCheckpointPrice;
    } else if (weiRaised < secondCheckpoint) {
      price = secondCheckpointPrice;
    } else if (weiRaised < thirdCheckpoint) {
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
    uint256 weiAmount = weiRaised.add(msg.value);
    bool nonZeroPurchase = msg.value != 0;
    bool withinCap = cap.mul(BASE_PRICE_IN_WEI) >= weiAmount;

    return withinCap && nonZeroPurchase && withinPeriod;
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
    Finalized();

    finalized = true;
  }

  modifier whenNotFinalized() {
    require(!paused);
    _;
  }

}