pragma solidity ^0.4.14;

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
  uint256 public initialSupply;
  uint256 public startBlock;
  uint256 public endBlock;
  uint256 public remainingTokens;
  uint256 public allocatedTokens;
  address public proofWallet;
  bool public finalized;

  uint256 public basePriceInWei = 88000000000000000;
  uint256 public constant TOTAL_TOKENS = 2 * 1181031 * (10 ** 18);
  uint256 public constant PUBLIC_TOKENS = 1181031 * (10 ** 18);
  uint256 public constant TOKENS_ALLOCATED_TO_PROOF = 1181031 * (10 ** 18);
  uint256 public constant TOTAL_PRESALE_TOKENS = 112386712924725508802400;


  uint256 public capInBaseUnits = TOTAL_TOKENS - TOTAL_PRESALE_TOKENS;
  uint256 public cap = capInBaseUnits / (10 ** 18);
  uint256 public capInWei = cap * basePriceInWei;

  uint256 public firstCheckpoint = (capInWei * 5) / 100;
  uint256 public secondCheckpoint = (capInWei * 15) / 100;   //15% of tokens sold
  uint256 public thirdCheckpoint = (capInWei * 25) / 100;    //25% of tokens sold

  uint256 public firstCheckpointPrice = (basePriceInWei * 80) / 100;
  uint256 public secondCheckpointPrice = (basePriceInWei * 90) / 100;
  uint256 public thirdCheckpointPrice = (basePriceInWei * 95) / 100;

  /**
   * event for token purchase logging
   * @param purchaser who paid for the tokens
   * @param beneficiary who got the tokens
   * @param value weis paid for purchase
   * @param amount amount of tokens purchased
   */
  event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);
  event NewCloneToken(address indexed _cloneToken, uint _snapshotBlock);
  event OnTransfer(address _from, address _to, uint _amount);
  event OnApprove(address _owner, address _spender, uint _amount);
  event LogInt(string _name, uint256 _value);

  /**
   * event for signaling finished crowdsale
   */
  event Finalized();

  function TokenSale(
    address _wallet,
    address _tokenAddress,
    uint256 _startBlock,
    uint256 _endBlock) {
    require(_wallet != 0x0);
    require(_tokenAddress != 0x0);
    require(_startBlock > 0);
    require(_endBlock > _startBlock);

    wallet = _wallet;
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

  function getPriceInWei() public returns (uint256) {

    uint256 price;

    if (weiRaised < firstCheckpoint) {
      price = firstCheckpointPrice;
    } else if (weiRaised < secondCheckpoint) {
      price = secondCheckpointPrice;
    } else if (weiRaised < thirdCheckpoint) {
      price = thirdCheckpointPrice;
    } else {
      price = basePriceInWei;
    }

    return price;
  }


  /**
   * Low level token purchase function
   * @param beneficiary will recieve the tokens.
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


  function forwardFunds() internal {
    wallet.transfer(msg.value);
  }

  function validPurchase() internal returns (bool) {
    uint256 current = block.number;
    bool withinPeriod = current >= startBlock && current <= endBlock;
    uint256 weiAmount = weiRaised.add(msg.value);
    bool nonZeroPurchase = msg.value != 0;
    bool withinCap = cap.mul(basePriceInWei) >= weiAmount;  //probably needs to be updated

    return withinCap && nonZeroPurchase && withinPeriod;
  }


  function totalSupply() public constant returns (uint256) {
    return proofToken.totalSupply();
  }

  function balanceOf(address _owner) public constant returns (uint256) {
    return proofToken.balanceOf(_owner);
  }

  //controller interface

  // function proxyPayment(address _owner) payable public {
  //   revert();
  // }

  function onTransfer(address _from, address _to, uint _amount) public returns (bool) {
    OnTransfer(_from, _to, _amount);
    return true;
  }

  function onApprove(address _owner, address _spender, uint _amount) public returns (bool) {
    OnApprove(_owner, _spender, _amount);
    return true;
  }

  function createCloneToken(uint _snapshotBlock, string _cloneTokenName, string _cloneTokenSymbol) public onlyOwner {
    address cloneTokenAddress = proofToken.createCloneToken(_snapshotBlock, _cloneTokenName, _cloneTokenSymbol);
    NewCloneToken(cloneTokenAddress, _snapshotBlock);
  }

  function changeController(address newController) public onlyOwner {
    proofToken.transferControl(newController);
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