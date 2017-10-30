module.exports = async function (callback) {

      require('babel-register')
      require('babel-polyfill')
      require('./jsHelpers.js')

      const Web3 = require('web3')
      const TokenSale = artifacts.require('./TokenSale.sol')
      const provider = artifacts.options.provider
      const web3 = new Web3(provider)
      const config = require('../config')

      let tokenSale
      let sender

      let newOwner = '0x2C798A55024Dd46657aD3233e271505D198b36e9'

      web3.eth.getAccounts(function(error,result) {
        let sender = result[0]
        run(sender)
        callback()
      })

      const run = async function(sender) {
        tokenSale = await TokenSale.deployed()
        let txn = await tokenSale.transferOwnership(newOwner, { from: sender, gas: config.constants.DEFAULT_GAS, gasPrice: config.constants.DEFAULT_GAS_PRICE })
      }
    }

