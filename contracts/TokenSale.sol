pragma solidity ^0.4.11;

import './SafeMath.sol';
import './ProofToken.sol';
import './Pausable.sol';
import './ProofPresaleToken.sol';


/**
 * @title Tokensale
 * Tokensale allows investors to make token purchases and assigns them tokens based
 * on a token per ETH rate. Funds collected are forwarded to a wallet as they arrive.
 */
contract Tokensale is Pausable {

  using SafeMath for uint256;

  ProofToken public proofToken;
  ProofPresaleToken public proofPresaleToken;
  address public wallet;
  uint public weiRaised;
  uint public cap;
  uint256 public rate;
  uint256 public priceInWei;
  uint256 public pointsMultiplier;
  bool public isFinalized;

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



  function tokenSale(address _wallet, uint256 _presaleTokenAddress, address _tokenAddress) {
    require(_wallet != 0x0);
    require(_presaleTokenAddress != 0x0);
    require(_tokenAddress != 0x0);

    wallet = _wallet;
    proofToken = ProofToken(_tokenAddress);
    proofPresaleToken = ProofPresaleToken(_presaleTokenAddress);

    priceInWei = 88000000000000000;
    pointsMultiplier = (10**18);
    cap = 300000 * (10**18);
  }


  function() payable {
    buyTokens(msg.sender);
  }

  /**
   * Low level token purchase function
   * @param beneficiary will recieve the tokens.
   */
  function buyTokens(address beneficiary) payable whenNotPaused {
    require(beneficiary != 0x0);
    require(validPurchase());

    uint256 weiAmount = msg.value;
    weiRaised = weiRaised.add(weiAmount);
    uint256 tokens = weiAmount.mul(pointsMultiplier).div(priceInWei);

    proofToken.mint(beneficiary, tokens);
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);
    forwardFunds();
  }


  function forwardFunds() internal {
    wallet.transfer(msg.value);
  }


  function validPurchase() internal constant returns (bool) {

    uint256 weiAmount = weiRaised.add(msg.value);
    bool withinCap = weiAmount.mul(pointsMultiplier).div(priceInWei) <= cap;

    return withinCap;
  }


  function finalize() onlyOwner {
    require(!isFinalized);
    require(hasEnded());

    proofToken.finishMinting();
    Finalized();

    isFinalized = true;
  }


  function hasEnded() public constant returns (bool) {
    bool capReached = (weiRaised.mul(pointsMultiplier).div(priceInWei) >= cap);
    return capReached;
  }



}
