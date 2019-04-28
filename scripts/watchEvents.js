module.exports = async function (callback) {

    require('babel-register')
    require('babel-polyfill')
    require('./jsHelpers.js')

    const Web3 = require('web3')
    const provider = artifacts.options.provider
    const web3 = new Web3(provider)

    const Token = artifacts.require('./Token.sol')
    const TokenSale = artifacts.require('./TokenSale.sol')

    const Token = await Token.deployed()
    const TokenSale = await TokenSale.deployed()

    console.log(Token.address)
    console.log(TokenSale.address)

    let tokenEvents = Token.allEvents()
    let tokenSaleEvents = TokenSale.allEvents()

    tokenEvents.watch((err,res) => {
      console.log("\n****************\n")
      console.log(res)
      console.log("\n****************\n")
    })

    tokenSaleEvents.watch((err,res) => {
      console.log("\n****************\n")
      console.log(res)
      console.log("\n****************\n")
    })

    callback()
  }