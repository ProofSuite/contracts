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

    console.log(proofToken.address)
    console.log(proofTokenSale.address)

    let tokenEvents = proofToken.allEvents()
    let tokenSaleEvents = proofTokenSale.allEvents()

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