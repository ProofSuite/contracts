import { DEFAULT_GAS, DEFAULT_GAS_PRICE } from './scripts/testConfig.js'

var ProofPresaleToken = artifacts.require('./ProofPresaleToken.sol');
var ProofToken = artifacts.require('./ProofToken.sol');
var TokenSale = artifacts.require('./TokenSale.sol');


module.exports = function(deployer) {

  let wallet = '0xe2b3204f29ab45d5fd074ff02ade098fbc381d42'
  let proofWalletAddress = '0xe2b3204f29ab45d5fd074ff02ade098fbc381d42'

  deployer.deploy(ProofPresaleToken)
  .then(function() {
    return deployer.deploy(
      ProofToken,
      ProofPresaleToken.address,
      proofWalletAddress,
      {gas: DEFAULT_GAS, gasPrice: DEFAULT_GAS_PRICE})
    })
  .then(function() {
    return deployer.deploy(
      TokenSale,
      wallet,
      ProofToken.address,
      10,
      20,
      {gas: DEFAULT_GAS, gasPrice: DEFAULT_GAS_PRICE})
    });

  };
