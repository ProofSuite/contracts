var ProofPresaleToken = artifacts.require('./ProofPresaleToken.sol');
var ProofToken = artifacts.require('./ProofToken.sol');
var TokenSale = artifacts.require('./TokenSale.sol');

module.exports = function(deployer) {

  let wallet = '0xe2b3204f29ab45d5fd074ff02ade098fbc381d42'
  let defaultGas = 4712388
  let defaultGasPrice = 1000000000

  deployer.deploy(ProofPresaleToken)
  .then(function() {
    return deployer.deploy(
      ProofToken,
      ProofPresaleToken.address,
      {gas: defaultGas, gasPrice: defaultGasPrice})
    })
  .then(function() {
    return deployer.deploy(
      TokenSale,
      wallet,
      ProofPresaleToken.address,
      ProofToken.address,
      {gas: defaultGas, gasPrice: defaultGasPrice})
    });

  };
