// Allows us to use ES6 in our migrations and tests.
// Not quite sure this is necessary
require('babel-register');
require('babel-polyfill');

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
      gas: 4710388,
      from: '0xdf08f82de32b8d460adbe8d72043e3a7e25a3b39'  // testprc main account here
    },
    testnet: {
      host: 'localhost',
      port: 8545,
      network_id: 3,
      gas: 471000,
      gasPrice: 220000000,
      from: '0xdf08f82de32b8d460adbe8d72043e3a7e25a3b39'     // ethereum testnet (ex: ropsten) main account
    },
    mainnet: {
      host: 'localhost',
      port: 8545,
      network_id: 1,
      gas: 4712388,
      from: '0xdf08f82de32b8d460adbe8d72043e3a7e25a3b39'     // ethereum mainnet main account
    }
  }
}
