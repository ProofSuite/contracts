pragma solidity ^0.4.13;

contract ERC20 {

  uint256 public totalSupply;

  function balanceOf(address _owner) constant returns (uint256);
  function transfer(address _to, uint256 _value) returns (bool);
  function transferFrom(address _from, address _to, uint256 _value) returns (bool);
  function approve(address _spender, uint256 _value) returns (bool);
  function allowance(address _owner, address _spender) constant returns (uint256);

  event Transfer(address indexed _from, address indexed _to, uint256 _value);
  event Approval(address indexed _owner, address indexed _spender, uint256 _value);

}

contract Ownable {
  address public owner;


  /**
   * @dev The Ownable constructor sets the original `owner` of the contract to the sender
   * account.
   */
  function Ownable() {
    owner = msg.sender;
  }


  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }


  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param newOwner The address to transfer ownership to.
   */
  function transferOwnership(address newOwner) onlyOwner {
    if (newOwner != address(0)) {
      owner = newOwner;
    }
  }

}

contract Pausable is Ownable {
  event Pause();
  event Unpause();

  bool public paused = false;

  function Pausable() {}

  /**
   * @dev modifier to allow actions only when the contract IS paused
   */
  modifier whenNotPaused() {
    require(!paused);
    _;
  }

  /**
   * @dev modifier to allow actions only when the contract IS NOT paused
   */
  modifier whenPaused {
    require(paused);
    _;
  }

  /**
   * @dev called by the owner to pause, triggers stopped state
   */
  function pause() onlyOwner whenNotPaused returns (bool) {
    paused = true;
    Pause();
    return true;
  }

  /**
   * @dev called by the owner to unpause, returns to normal state
   */
  function unpause() onlyOwner whenPaused returns (bool) {
    paused = false;
    Unpause();
    return true;
  }
}

library SafeMath {
  function mul(uint256 a, uint256 b) internal constant returns (uint256) {
    uint256 c = a * b;
    assert(a == 0 || c / a == b);
    return c;
  }

  function div(uint256 a, uint256 b) internal constant returns (uint256) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return c;
  }

  function sub(uint256 a, uint256 b) internal constant returns (uint256) {
    assert(b <= a);
    return a - b;
  }

  function add(uint256 a, uint256 b) internal constant returns (uint256) {
    uint256 c = a + b;
    assert(c >= a);
    return c;
  }
}

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
  bool public isFinalized;

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
  function buyTokens(address beneficiary) payable whenNotPaused {
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

  /**
  @dev Not sure if this function is actually effective. From my understanding, the number of wei
  @dev raised needs to be exactly equal to the cap which is probably never going to be reached
  @dev exactly. Maybe better to just remove this function ?
   */
  function finalize() onlyOwner {
    require(!isFinalized);
    require(hasEnded());

    proofToken.finishMinting();
    Finalized();

    isFinalized = true;
  }

  /**
  @dev Not sure if this function is actually effective. From my understanding, the number of wei
  @dev raised needs to be exactly equal to the cap which is probably never going to be reached
  @dev exactly. Maybe better to just remove this function ?
   */
  function hasEnded() public constant returns (bool) {
    bool capReached = weiRaised >= cap.mul(priceInWei);
    return capReached;
  }

  function totalSupply() public constant returns (uint256) {
    return proofToken.totalSupply();
  }

  function balanceOf(address _owner) public constant returns (uint256) {
    return proofToken.balanceOf(_owner);
  }
}

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

contract ProofPresaleToken is ERC20, Ownable {

  using SafeMath for uint256;

  mapping(address => uint) balances;
  mapping (address => mapping (address => uint)) allowed;

  string public constant name = "Proof Presale Token";
  string public constant symbol = "PPT";
  uint8 public constant decimals = 18;
  bool public mintingFinished = false;

  event Mint(address indexed to, uint256 amount);
  event MintFinished();

  function ProofPresaleToken() {}

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


  modifier canMint() {
    require(!mintingFinished);
    _;
  }

  function mint(address _to, uint256 _amount) canMint returns (bool) {
    totalSupply = totalSupply.add(_amount);
    balances[_to] = balances[_to].add(_amount);
    Mint(_to, _amount);
    return true;
  }

  function finishMinting() onlyOwner returns (bool) {
    mintingFinished = true;
    MintFinished();
    return true;
  }


}

