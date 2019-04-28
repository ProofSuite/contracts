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

    let Token
    let tokenSale
    let sender

    web3.eth.getAccounts(function(error,result) {
      let sender = result[0]
      run(sender)
      callback()
    })

    const run = async function(sender) {
      Token = await Token.deployed()
      tokenSale = await TokenSale.deployed()
      let txn = await Token.transferControl(tokenSale.address, { from: sender, gas: config.constants.DEFAULT_GAS, gasPrice: config.constants.DEFAULT_HIGH_GAS_PRICE })
    }
  }

