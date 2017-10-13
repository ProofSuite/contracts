module.exports = async function (callback) {

  Array.prototype.toNumber = function () {
    return this.map((elem) => { return parseInt(elem) })
  }

  const getAddress = async (contract) => {
    let address = contract.address
    return address
  }

  const importBalances = async(token, presaleToken, caller, addresses, balances, wallet) => {
    let presaleTokenAddress = await getAddress(presaleToken)
    let txn = await token.importPresaleBalances(addresses, balances, presaleTokenAddress, wallet, { from: caller, gas: config.constants.MAX_GAS })
  }

  require('babel-register')
  require('babel-polyfill')
  require('./jsHelpers.js')

  const fs = require('fs')
  const csv = require('csv-parser')
  const Web3 = require('web3')
  const config = require('../config.js')

  const ProofPresaleToken = artifacts.require('./ProofPresaleToken.sol')
  const ProofToken = artifacts.require('./ProofToken.sol')
  const provider = artifacts.options.provider
  const web3 = new Web3(provider)

  let proofToken
  let proofPresaleToken

  let fund

  web3.eth.getAccounts(function(error,result) {
    fund = result[0]
  })

  const run = async function(){

    proofToken = await ProofToken.deployed()
    proofPresaleToken = await ProofPresaleToken.deployed()
    await launchImport()
  }

  const launchImport = async function() {
    let addresses = []
    let balances = []

    const writeData = new Promise((resolve, reject) => {
      fs.createReadStream('./test/balances.csv')
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

    for (let i = 0; i < addressListNumber; i = i + 100) {
      let addressesBatch = addresses.slice(i, i + 100)
      let balancesBatch = balances.slice(i, i + 100)
      let wallet = config.addresses.rinkeby.TOKEN_WALLET_ADDRESS
      let receipt = await importBalances(proofToken, proofPresaleToken, fund, addressesBatch, balancesBatch, wallet)
    }
  }

  await run()
  callback()
}

