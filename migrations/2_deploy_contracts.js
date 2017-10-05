var ProofPresaleToken = artifacts.require('./ProofPresaleToken.sol');
var ProofToken = artifacts.require('./ProofToken.sol');
var TokenSale = artifacts.require('./TokenSale.sol');
var TokenFactory = artifacts.require('./TokenFactory.sol')

const DEFAULT_GAS = 4.7 * 10 ** 6
const DEFAULT_LOW_GAS_PRICE = 2 * 10 ** 9
const DEFAULT_GAS_PRICE = 6 * 10 ** 9
const DEFAULT_HIGH_GAS_PRICE = 40 * 10 ** 9
const WALLET_ADDRESS = '0xe2b3204f29ab45d5fd074ff02ade098fbc381d42'
const PROOF_WALLET_ADDRESS = '0xe2b3204f29ab45d5fd074ff02ade098fbc381d42'

module.exports = function(deployer) {

    deployer.deploy(
      ProofPresaleToken
    )
    .then(function() {
      return deployer.deploy(
        TokenFactory,
        {gas: DEFAULT_GAS, gasPrice: DEFAULT_HIGH_GAS_PRICE }
      )
    })
    .then(function() {
      return deployer.deploy(
        ProofToken,
        TokenFactory.address,
        "0x0",
        0,
        "Proof Token",
        "PRFT",
        true
      )
    })
    .then(function() {
      return deployer.deploy(
        TokenSale,
        WALLET_ADDRESS,
        ProofToken.address,
        10,
        20,
        {gas: DEFAULT_GAS, gasPrice: DEFAULT_HIGH_GAS_PRICE}
      )
    })

  }



