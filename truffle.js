var config = require('./config')

require('babel-register')
require('babel-polyfill')

const LightWalletProvider = require('@digix/truffle-lightwallet-provider')

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
      gas: config.constants.MAX_GAS,
      from: '0xdf08f82de32b8d460adbe8d72043e3a7e25a3b39'  // testprc main account here
    },
    ethereum: {
      provider: new LightWalletProvider({
        keystore: '/Users/davidvanisacker/.sigmate/sigmate-v3-tokensale-mainnet.json',
        password: '*********',
        rpcUrl: config.infura.ethereum
      }),
      network_id: '1'
    },
    ropsten: {
      provider: new LightWalletProvider({
        keystore: '/Users/davidvanisacker/.sigmate/sigmate-v3-tokensale-ropsten.json',
        password: 'popcorn123!',
        rpcUrl: config.infura.ropsten
      }),
      network_id: '3'
    },
    rinkeby: {
      provider: new LightWalletProvider({
        keystore: '/Users/davidvanisacker/.sigmate/sigmate-v3-tokensale-rinkeby.json',
        password: 'popcorn123!',
        rpcUrl: config.infura.rinkeby
      }),
      network_id: '4'
    }
  }
}
