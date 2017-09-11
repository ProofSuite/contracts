import { DEFAULT_GAS, DEFAULT_GAS_PRICE, WALLET_ADDRESS, PROOF_WALLET_ADDRESS } from './scripts/testConfig.js'

var ProofPresaleToken = artifacts.require('./ProofPresaleToken.sol');
var ProofToken = artifacts.require('./ProofToken.sol');
var TokenSale = artifacts.require('./TokenSale.sol');


module.exports = function(deployer) {

  deployer.deploy(ProofPresaleToken)
  .then(function() {
    return deployer.deploy(
      ProofToken,
      ProofPresaleToken.address,
      PROOF_WALLET_ADDRESS,
      {gas: DEFAULT_GAS, gasPrice: DEFAULT_GAS_PRICE})
    })
  .then(function() {
    return deployer.deploy(
      TokenSale,
      WALLET_ADDRESS,
      ProofToken.address,
      10,
      20,
      {gas: DEFAULT_GAS, gasPrice: DEFAULT_GAS_PRICE})
    });

  };
