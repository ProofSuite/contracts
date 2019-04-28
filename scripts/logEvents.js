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

  let tokenEvents = Token.allEvents({fromBlock: 1047310, toBlock: 'latest'})
  let tokenSaleEvents = TokenSale.allEvents({fromBlock: 0, toBlock: 'latest'})

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