module.exports = async function (callback) {

      require('babel-register')
      require('babel-polyfill')
      require('./jsHelpers.js')

      const Web3 = require('web3')
      const Token = artifacts.require('./Token.sol')
      const provider = artifacts.options.provider
      const web3 = new Web3(provider)
      const config = require('../config')

      let Token
      let sender

      web3.eth.getAccounts(function(error,result) {
        let sender = result[0]
        run(sender)
        callback()
      })

      const run = async function(sender) {
        Token = await Token.deployed()
        let txn = await Token.lockPresaleBalances({ from: sender, gas: config.constants.DEFAULT_GAS, gasPrice: config.constants.DEFAULT_HIGH_GAS_PRICE })
      }
    }

