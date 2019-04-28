module.exports = async function (callback) {

  Array.prototype.toNumber = function () {
    return this.map((elem) => { return parseFloat(elem) })
  }

  require('babel-register')
  require('babel-polyfill')
  require('./jsHelpers.js')

  const fs = require('fs')
  const csv = require('csv-parser')
  const Web3 = require('web3')
  const config = require('../config.js')

  const ProofPresaleToken = artifacts.require('./ProofPresaleToken.sol')
  const Token = artifacts.require('./Token.sol')
  const provider = artifacts.options.provider
  const web3 = new Web3(provider)

  let Token
  let proofPresaleToken
  let fund

  web3.eth.getAccounts(function(error,result) {
    fund = result[0]
  })


  const getAddress = async (contract) => {
    let address = contract.address
    return address
  }

  const importBalances = async(token, caller, addresses, balances) => {
    let txn = await token.importPresaleBalances(addresses, balances, { from: caller, gas: config.constants.MAX_GAS, gasPrice: config.constants.DEFAULT_HIGH_GAS_PRICE })
  }

  const run = async function(){
    Token = await Token.deployed()
    await launchImport()
  }

  const launchImport = async function() {
    let addresses = []
    let balances = []

    const writeData = new Promise((resolve, reject) => {
      fs.createReadStream('./scripts/balances.csv')
      .pipe(csv())
      .on('data', function (data) {
        addresses.push(data['address'])
        balances.push(data['balance'])
      })
      .on('end', resolve)
    })

    await writeData
    balances = balances.toNumber()

    let addressListNumber = addresses.length

    for (let i = 0; i < addressListNumber; i = i + 50) {
      let addressesBatch = addresses.slice(i, i + 50)
      let balancesBatch = balances.slice(i, i + 50)
      let receipt = await importBalances(Token, fund, addressesBatch, balancesBatch)
    }
  }

  await run()
  callback()
}

