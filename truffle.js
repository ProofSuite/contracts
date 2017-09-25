// Allows us to use ES6 in our migrations and tests.
// Not quite sure this is necessary

var config = require('./scripts/testConfig')

require('babel-register')
require('babel-polyfill')

import { DEFAULT_GAS,
          DEFAULT_GAS_PRICE,
         DEFAULT_HIGH_GAS_PRICE
         } from '../scripts/testConfig.js'

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
      gas: DEFAULT_GAS,
      from: '0xdf08f82de32b8d460adbe8d72043e3a7e25a3b39'  // testprc main account here
    },
    testnet: {
      host: 'localhost',
      port: 8545,
      network_id: 3,
      gas: DEFAULT_GAS,
      gasPrice: DEFAULT_HIGH_GAS_PRICE,
      from: '0x38ef4f14eaced72a030c2a3588210b83b0e4944a'     // ethereum testnet (ex: ropsten) main account
    },
    mainnet: {
      host: 'localhost',
      port: 8545,
      network_id: 1,
      gas: DEFAULT_GAS,
      gasPrice: DEFAULT_GAS_PRICE,
      from: '0xdf08f82de32b8d460adbe8d72043e3a7e25a3b39'     // ethereum mainnet main account
    }
  }
}
