const config = require('../config.js')

const ProofToken = artifacts.require('./ProofToken.sol');
const TokenSale = artifacts.require('./TokenSale.sol');
const TokenFactory = artifacts.require('./TokenFactory.sol')

let wallet, gas, gasPrice;


module.exports = function(deployer) {

    if (deployer.network == "ethereum") {
      wallet = config.addresses.ethereum.WALLET_ADDRESS
      gas = config.constants.MAX_GAS
      gasPrice = config.constants.DEFAULT_GAS_PRICE
    } else if (deployer.network == "ropsten") {
      wallet = config.addresses.ropsten.WALLET_ADDRESS
      gas = config.constants.DEFAULT_GAS
      gasPrice = config.constants.DEFAULT_HIGH_GAS_PRICE
    } else if (deployer.network == "rinkeby") {
      wallet = config.addresses.rinkeby.WALLET_ADDRESS
      gas = config.constants.MAX_GAS
      gasPrice = config.constants.DEFAULT_GAS_PRICE
    } else if (deployer.network == "development") {
      wallet = config.addresses.development.WALLET_ADDRESS
      gas = config.constants.MAX_GAS
      gasPrice = config.constants.DEFAULT_GAS_PRICE
    } else {
      throw new Error("Wallet not set")
    }

    console.log(gas)
    console.log(gasPrice)

    deployer.deploy(
        TokenFactory,
        {gas: gas, gasPrice: gasPrice }
      )
    .then(function() {
      return deployer.deploy(
        ProofToken,
        TokenFactory.address,
        "0x0000000000000000000000000000000000000000",
        0,
        "Test",
        "Test",
        {gas: gas, gasPrice: gasPrice }
      )
    })
    .then(function() {
      return deployer.deploy(
        TokenSale,
        wallet,
        ProofToken.address,
        1000000,
        2000000,
        {gas: gas, gasPrice: gasPrice }
      )
    })
  }



