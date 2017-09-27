// Allows us to use ES6 in our migrations and tests.
// Not quite sure this is necessary

var config = require('./config')
var bip39 = require('bip39')
var keythereum = require('keythereum')
var walletGenerator = require('ethereumjs-wallet')
var ProviderEngine = require('web3-provider-engine')
var WalletSubProvider = require('web3-provider-engine/subproviders/wallet.js')
var Web3Subprovider = require('web3-provider-engine/subproviders/web3.js')
var Web3 = require('web3')
var providerUrl = config.infura.rinkeby
var engine = new ProviderEngine();

var keystore = keythereum.importFromFile(config.rinkeby.wallet.address, config.rinkeby.datadir)
var privateKey = keythereum.recover(config.rinkeby.wallet.password, keystore)
var wallet = walletGenerator.fromPrivateKey(privateKey)

engine.addProvider(new WalletSubProvider(wallet, {}))
engine.addProvider(new Web3Subprovider(new Web3.providers.HttpProvider(providerUrl)));

engine.on('block', function(block){
  console.log('================================')
  console.log('New block:', '#'+block.number.toString('hex'), '0x'+block.hash.toString('hex'))
  console.log('================================')
})

engine.on('error', function(err) {
  console.log(err.stack)
})

engine.start();

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
      gas: config.constants.DEFAULT_GAS,
      from: '0xdf08f82de32b8d460adbe8d72043e3a7e25a3b39'  // testrpc deployer account
    },
    testnet: {
      network_id: 3,
      provider: engine,
      gas: config.constants.DEFAULT_GAS,
      gasPrice: config.constants.DEFAULT_HIGH_GAS_PRICE,
      from: '0x38ef4f14eaced72a030c2a3588210b83b0e4944a'     // ropsten deployer account
    },
    rinkeby: {
      network_id: 4,
      provider: engine,
      gas: config.constants.DEFAULT_GAS,
      gasPrice: config.constants.DEFAULT_HIGH_GAS_PRICE,
      from: '0x9d919eae7087eae6a7e4452e0b2c05f88613f50e'
    },
    mainnet: {
      host: 'localhost',
      port: 8545,
      network_id: 1,
      provider: engine,
      gas: config.constants.DEFAULT_GAS,
      gasPrice: config.constants.DEFAULT_GAS_PRICE,
      from: '0xdf08f82de32b8d460adbe8d72043e3a7e25a3b39'     // ethereum deployer account
    }
  },
  rpc: {
    host: "localhost",
    port: 8545
  }
}
