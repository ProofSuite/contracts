module.exports = async function (callback) {

      require('babel-register')
      require('babel-polyfill')
      require('./jsHelpers.js')

      const Web3 = require('web3')
      const Token = artifacts.require('./Token.sol')
      const TokenSale = artifacts.require('./TokenSale.sol')
      const provider = artifacts.options.provider
      const web3 = new Web3(provider)
      const config = require('../config')

      let tokenSale
      let sender

      web3.eth.getAccounts(function(error,result) {
        let sender = result[0]
        run(sender)
        callback("Success")
      })

      const run = async function(sender) {
        tokenSale = await TokenSale.deployed()
        let txn = await tokenSale.enableTransfers(true, { from: sender, gas: config.constants.DEFAULT_GAS, gasPrice: config.constants.DEFAULT_GAS_PRICE })
      }
    }

