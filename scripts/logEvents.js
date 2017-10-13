module.exports = async function (callback) {

  require('babel-register')
  require('babel-polyfill')
  require('./jsHelpers.js')

  const Web3 = require('web3')
  const provider = artifacts.options.provider
  const web3 = new Web3(provider)

  const ProofToken = artifacts.require('./ProofToken.sol')
  const TokenSale = artifacts.require('./TokenSale.sol')

  const proofToken = await ProofToken.deployed()
  const proofTokenSale = await TokenSale.deployed()

  let tokenEvents = proofToken.allEvents({fromBlock: 1047310, toBlock: 'latest'})
  let tokenSaleEvents = proofTokenSale.allEvents({fromBlock: 0, toBlock: 'latest'})

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