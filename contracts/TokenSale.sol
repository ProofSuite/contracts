pragma solidity ^0.5.0;

import './SafeMath.sol';
import './Pausable.sol';
import './TokenInterface.sol';
/**
 * @title Tokensale
 * Tokensale allows investors to make token purchases and assigns them tokens based

 * on a token per ETH rate. Funds collected are forwarded to a wallet as they arrive.
 */
 contract TokenSale is Pausable {

   using SafeMath for uint256;

   TokenInterface public Token;
   uint256 public totalWeiRaised;
   uint256 public tokensMinted;
   uint256 public _totalSupply;
   uint256 public contributors;
   uint256 public decimalsMultiplier;
   uint256 public startTime;
   uint256 public endTime;
   uint256 public remainingTokens;
   uint256 public allocatedTokens;

   bool public finalized;

   bool public TokensAllocated;
   address payable public proofMultiSig = 0x99892Ac6DA1b3851167Cb959fE945926bca89f09;

   uint256 public constant BASE_PRICE_IN_WEI = 88000000000000000;
   uint256 public constant PUBLIC_TOKENS = 1181031 * (10 ** 18);
   uint256 public constant TOTAL_PRESALE_TOKENS = 112386712924725508802400;
   uint256 public constant TOKENS_ALLOCATED_TO_PROOF = 1181031 * (10 ** 18);



   uint256 public tokenCap = PUBLIC_TOKENS - TOTAL_PRESALE_TOKENS;
   uint256 public cap = tokenCap / (10 ** 18);
   uint256 public weiCap = cap * BASE_PRICE_IN_WEI;

   uint256 public firstDiscountPrice = (BASE_PRICE_IN_WEI * 85) / 100;
   uint256 public secondDiscountPrice = (BASE_PRICE_IN_WEI * 90) / 100;
   uint256 public thirdDiscountPrice = (BASE_PRICE_IN_WEI * 95) / 100;

   uint256 public firstDiscountCap = (weiCap * 5) / 100;
   uint256 public secondDiscountCap = (weiCap * 10) / 100;
   uint256 public thirdDiscountCap = (weiCap * 20) / 100;

   bool public started = false;

   event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);
   event NewClonedToken(address indexed _cloneToken);
   event OnTransfer(address _from, address _to, uint _amount);
   event OnApprove(address _owner, address _spender, uint _amount);
   event LogInt(string _name, uint256 _value);
   event Finalized();

   constructor(address _tokenAddress, uint256 _startTime, uint256 _endTime) public {
     require(_tokenAddress != address(0));
     require(_startTime > 0);
     require(_endTime > _startTime);

     startTime = _startTime;
     endTime = _endTime;
     Token = TokenInterface(_tokenAddress);

     decimalsMultiplier = (10 ** 18);
   }


   /**
    * High level token purchase function
    */
   function() external payable {
     buyTokens(msg.sender);
   }

   /**
    * Low level token purchase function
    * @param _beneficiary will receive the tokens.
    */
   function buyTokens(address _beneficiary) public payable whenNotPaused whenNotFinalized {
     require(_beneficiary != address(0));
     require(validPurchase());

     uint256 weiAmount = msg.value;
     uint256 priceInWei = getPriceInWei();
     totalWeiRaised = totalWeiRaised.add(weiAmount);

     uint256 tokens = weiAmount.mul(decimalsMultiplier).div(priceInWei);
     tokensMinted = tokensMinted.add(tokens);
     require(tokensMinted < tokenCap);

     contributors = contributors.add(1);

     Token.mint(_beneficiary, tokens);
     emit TokenPurchase(msg.sender, _beneficiary, weiAmount, tokens);
     forwardFunds();
   }


   /**
    * Get the price in wei for current premium
    * @return price {uint256}
    */
   function getPriceInWei() view public returns (uint256) {

     uint256 price;

     if (totalWeiRaised < firstDiscountCap) {
       price = firstDiscountPrice;
     } else if (totalWeiRaised < secondDiscountCap) {
       price = secondDiscountPrice;
     } else if (totalWeiRaised < thirdDiscountCap) {
       price = thirdDiscountPrice;
     } else {
       price = BASE_PRICE_IN_WEI;
     }

     return price;
   }

   /**
   * Forwards funds to the tokensale wallet
   */
   function forwardFunds() internal {
     address(proofMultiSig).transfer(msg.value);
   }


   /**
   * Validates the purchase (period, minimum amount, within cap)
   * @return {bool} valid
   */
   function validPurchase() internal returns (bool) {
     uint256 current = now;
     bool presaleStarted = (current >= startTime || started);
     bool presaleNotEnded = current <= endTime;
     bool nonZeroPurchase = msg.value != 0;
     return nonZeroPurchase && presaleStarted && presaleNotEnded;
   }

   /**
   * Returns the total WIRA token supply
   * @return totalSupply {uint256} WIRA Token Total Supply
   */
   function totalSupply() public view returns (uint256) {
     return Token.totalSupply();
   }

   /**
   * Returns token holder WIRA Token balance
   * @param _owner {address} Token holder address
   * @return balance {uint256} Corresponding token holder balance
   */
   function balanceOf(address _owner) public view returns (uint256) {
     return Token.balanceOf(_owner);
   }

   /**
   * Change the WIRA Token controller
   * @param _newController {address} New WIRA Token controller
   */
   function changeController(address _newController) public {
     require(isContract(_newController));
     Token.transferControl(_newController);
   }


   function enableTransfers() public {
     if (now < endTime) {
       require(msg.sender == owner);
     }
     Token.enableTransfers(true);
   }

   function lockTransfers() public onlyOwner {
     require(now < endTime);
     Token.enableTransfers(false);
   }

   function enableMasterTransfers() public onlyOwner {
     Token.enableMasterTransfers(true);
   }

   function lockMasterTransfers() public onlyOwner {
     Token.enableMasterTransfers(false);
   }

   function forceStart() public onlyOwner {
     started = true;
   }

   function allocateTokens() public onlyOwner whenNotFinalized {
     require(!TokensAllocated);
     Token.mint(proofMultiSig, TOKENS_ALLOCATED_TO_PROOF);
     TokensAllocated = true;
   }

   function finalize() public onlyOwner {
     require(paused);
     require(TokensAllocated);

     Token.finishMinting();
     Token.enableTransfers(true);
     emit Finalized();

     finalized = true;
   }


   function isContract(address _addr) view internal returns(bool) {
     uint size;
     if (_addr == address(0))
       return false;
     assembly {
         size := extcodesize(_addr)
     }
     return size>0;
   }

   modifier whenNotFinalized() {
     require(!finalized);
     _;
   }

 }
