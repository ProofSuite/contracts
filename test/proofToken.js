require('babel-register')
require('babel-polyfill')
require('../scripts/jsHelpers.js')

const fs = require('fs')
const csv = require('csv-parser')
const json2csv = require('json2csv')

const BigNumber = web3.BigNumber
let chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var chaiStats = require('chai-stats')
var chaiBigNumber = require('chai-bignumber')(BigNumber)
chai.use(chaiAsPromised).use(chaiBigNumber).use(chaiStats).should()

import {
  DEFAULT_GAS,
  DEFAULT_GAS_PRICE,
  TOKENS_ALLOCATED_TO_PROOF
} from '../scripts/testConfig.js'

import {
  getAddress,
  expectInvalidOpcode
} from '../scripts/helpers.js'

import {
  transferControl
} from '../scripts/controlHelpers.js'

import {
  getTokenBalance,
  getTokenBalanceAt,
  getTotalSupply,
  getTotalSupplyAt,
  mintToken,
  getController,
  transferToken,
  transferTokenFrom,
  approve,
  getAllowance,
  importBalances,
  lockBalances
} from '../scripts/tokenHelpers.js'

const assert = chai.assert
const should = chai.should()
const expect = chai.expect

const ProofPresaleToken = artifacts.require('./ProofPresaleToken.sol')
const ProofToken = artifacts.require('./ProofToken.sol')
const TokenSale = artifacts.require('./TokenSale.sol')

contract('proofToken', (accounts) => {
  let tokenSale
  let tokenSaleAddress
  let proofToken
  let proofPresaleToken
  let proofTokenAddress

  let fund = accounts[0]
  let sender = accounts[1]
  let receiver = accounts[2]
  let hacker = accounts[3]
  let wallet = accounts[4]

  let startBlock
  let endBlock

  beforeEach(async function() {
    startBlock = web3.eth.blockNumber + 10
    endBlock = web3.eth.blockNumber + 20

    proofPresaleToken = await ProofPresaleToken.new()

    proofToken = await ProofToken.new(
      '0x0',
      '0x0',
      0,
      'Proof Token',
      18,
      'PRFT',
      true)

    proofTokenAddress = await getAddress(proofToken)

    tokenSale = await TokenSale.new(
      wallet,
      proofTokenAddress,
      startBlock,
      endBlock
    )

    tokenSaleAddress = await getAddress(tokenSale)
  })

  describe('Initial State', function () {
    beforeEach(async function() {
      await transferControl(proofToken, fund, tokenSaleAddress)
    })

    it('should initially be controlled by the token sale contract', async function() {
      let proofTokenOwner = await getController(proofToken)
      proofTokenOwner.should.be.equal(tokenSaleAddress)
    })

    it('should have 18 decimals', async function() {
      let decimals = await proofToken.decimals.call()
      decimals.should.be.bignumber.equal(18)
    })

    it('should have Proof Token Name', async function() {
      let name = await proofToken.name.call()
      name.should.be.equal('Proof Token')
    })

    it('should have PRFT symbol', async function() {
      let symbol = await proofToken.symbol.call()
      symbol.should.be.equal('PRFT')
    })
  })

  describe('Import balances', function () {
    it('should correctly import a few balances', async function() {
      let addresses = [sender, receiver]
      let balances = [100, 100]
      await importBalances(proofToken, proofPresaleToken, fund, addresses, balances)

      let senderBalance = await getTokenBalance(proofToken, sender)
      let receiverBalance = await getTokenBalance(proofToken, receiver)

      senderBalance.should.be.equal(100)
      receiverBalance.should.be.equal(100)
    })

    it('should correctly import balances from a CSV file', async function() {
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
        await importBalances(proofToken, proofPresaleToken, fund, addressesBatch, balancesBatch)
      }

      for (let i = 0; i < 10; i++) {
        let balance = await getTokenBalance(proofToken, addresses[i])
        balance.should.be.equal(balances[i])
      }
    })

    it('have a total supply equal to the sum of the presale balances and proof tokens after importing', async function() {
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
        await importBalances(proofToken, proofPresaleToken, fund, addressesBatch, balancesBatch)
      }

      let expectedSupply = TOKENS_ALLOCATED_TO_PROOF + balances.sum()
      let supply = await getTotalSupply(proofToken)
      supply.should.be.equal(expectedSupply)
    })

    it('should not import balances if caller is not the owner of the contract', async function() {
      let addresses = []
      let balances = []

      const writeData = new Promise((resolve, reject) => {
        fs.createReadStream('./test/balances.csv')
        .pipe(csv())
        .on('data', function (data) {
          addresses.push(data['address'])
          balances.push(data['balances'])
        })
        .on('end', resolve)
      })

      await writeData
      balances = balances.toNumber()
      await expectInvalidOpcode(importBalances(proofToken, proofPresaleToken, hacker, addresses, balances))
    })

    it('can lock the presale balances', async function() {
      await lockBalances(proofToken, fund).should.be.fulfilled
      let balancesLocked = await proofToken.presaleBalancesLocked.call()
      balancesLocked.should.be.true
    })

    it('can not import presale balances after the presale balances are locked', async function () {
      await lockBalances(proofToken, fund).should.be.fulfilled
      let addresses = [hacker]
      let balances = [100]
      await expectInvalidOpcode(importBalances(proofToken, proofPresaleToken, fund, addresses, balances))

      let balance = await getTokenBalance(proofToken, hacker)
      balance.should.be.equal(0)
    })
  })

  describe('Minting', function () {
    it('should be mintable by owner contract', async function() {
      let initialTokenBalance = await getTokenBalance(proofToken, receiver)
      await mintToken(proofToken, fund, receiver, 100)

      let tokenBalance = await getTokenBalance(proofToken, receiver)
      let balanceIncrease = tokenBalance - initialTokenBalance

      balanceIncrease.should.be.equal(100)
    })

    it('should be mintable', async function() {
      let mintingFinished = await proofToken.mintingFinished.call()
      mintingFinished.should.be.equal(false)
    })

    it('should not be mintable by non-owner', async function() {
      transferControl(proofToken, fund, tokenSaleAddress)

      let initialTokenBalance = await getTokenBalance(proofToken, receiver)

      let params = { from:hacker, gas: DEFAULT_GAS, gasPrice: DEFAULT_GAS_PRICE }
      await expectInvalidOpcode(proofToken.mint(receiver, 100, params))

      let tokenBalance = await getTokenBalance(proofToken, receiver)
      let balanceIncrease = tokenBalance - initialTokenBalance

      balanceIncrease.should.be.equal(0)
    })

    it('can not be stopped by non-owner', async function() {
      transferControl(proofToken, fund, tokenSaleAddress)

      let params = { from: hacker, gas: DEFAULT_GAS, gasPrice: DEFAULT_GAS_PRICE }
      await expectInvalidOpcode(proofToken.finishMinting(params))

      let mintingFinished = await proofToken.mintingFinished.call()
      mintingFinished.should.be.equal(false)
    })
  })

  describe('Transfers', function () {
    it('should be transferable ', async function() {
      await mintToken(proofToken, fund, sender, 10000)

      let initialSenderBalance = await getTokenBalance(proofToken, sender)
      let initialReceiverBalance = await getTokenBalance(proofToken, receiver)

      await transferToken(proofToken, sender, receiver, 10000)

      let senderBalance = await getTokenBalance(proofToken, sender)
      let receiverBalance = await getTokenBalance(proofToken, receiver)

      let senderBalanceVariation = senderBalance - initialSenderBalance
      let receiverBalanceVariation = receiverBalance - initialReceiverBalance

      senderBalanceVariation.should.be.equal(-10000)
      receiverBalanceVariation.should.be.equal(10000)
    })

    it('should not allow to transfer more than balance', async function() {
      await mintToken(proofToken, fund, sender, 100)

      let params = { from: sender, gas: DEFAULT_GAS, gasPrice: DEFAULT_GAS_PRICE }
      await expectInvalidOpcode(proofToken.transfer(receiver, 101, params))
    })

    it('tokens should not be transferable to the token contract (by mistake)', async function() {
      await mintToken(proofToken, fund, sender, 1000)
      let params = { from: sender, gas: DEFAULT_GAS, gasPrice: DEFAULT_GAS_PRICE }
      await expectInvalidOpcode(proofToken.transfer(proofTokenAddress, 1000, params))
    })
  })

  describe('Balances: ', function () {
    it('balanceOf should return the proper token holder balance', async function() {
      await mintToken(proofToken, fund, sender, 10000)
      let balance = await getTokenBalance(proofToken, sender)
      balance.should.be.equal(10000)
    })

    it('balanceOfAt should return token holder balance at a previous block', async function() {
      let initialBlock = web3.eth.blockNumber
      await mintToken(proofToken, fund, sender, 10000)
      let currentBlock = web3.eth.blockNumber

      let initialBalance = await getTokenBalanceAt(proofToken, sender, initialBlock)
      let currentBalance = await getTokenBalanceAt(proofToken, sender, currentBlock)

      initialBalance.should.be.equal(0)
      currentBalance.should.be.equal(10000)
    })
  })

  describe('Total Supply: ', function () {
    it('totalSupply should be increase when new tokens are created', async function() {
      let initialSupply = await getTotalSupply(proofToken)
      await mintToken(proofToken, fund, sender, 10 ** 24)

      let supply = await getTotalSupply(proofToken)
      let supplyIncrease = supply - initialSupply
      supplyIncrease.should.be.equal(10 ** 24)
    })

    it('totalSupplyAt should correctly record total supply checkpoints', async function() {
      let firstBlock = web3.eth.blockNumber
      await mintToken(proofToken, fund, sender, 10000)
      let secondBlock = web3.eth.blockNumber
      await mintToken(proofToken, fund, sender, 10000)
      let thirdBlock = web3.eth.blockNumber

      let firstTotalSupply = await getTotalSupplyAt(proofToken, firstBlock)
      let secondTotalSupply = await getTotalSupplyAt(proofToken, secondBlock)
      let thirdTotalSupply = await getTotalSupplyAt(proofToken, thirdBlock)

      firstTotalSupply.should.be.equal(0)
      secondTotalSupply.should.be.equal(10000)
      thirdTotalSupply.should.be.equal(20000)
    })
  })

  describe('transferFrom: ', function () {
    it('should throw if no allowance has been given', async function() {
      await mintToken(proofToken, fund, sender, 1000)
      await expectInvalidOpcode(transferTokenFrom(proofToken, fund, sender, receiver, 1000))
    })

    it('should return correct allowance balance after approve call', async function() {
      await mintToken(proofToken, fund, sender, 1000)
      await approve(proofToken, sender, receiver, 1000)

      let allowance = await getAllowance(proofToken, sender, receiver)
      allowance.should.be.equal(1000)
    })

    it('should allow transfer if amount is lower than allowance', async function() {
      await mintToken(proofToken, fund, sender, 1000)
      await approve(proofToken, sender, receiver, 1000)
      await transferTokenFrom(proofToken, receiver, sender, receiver, 1000)

      let receiverBalance = await getTokenBalance(proofToken, receiver)
      let senderBalance = await getTokenBalance(proofToken, sender)

      receiverBalance.should.be.equal(1000)
      senderBalance.should.be.equal(0)
    })

    it('should return an exception if amount is higher than allowance', async function() {
      await mintToken(proofToken, fund, sender, 1000)
      await approve(proofToken, sender, receiver, 500)
      await expectInvalidOpcode(transferTokenFrom(proofToken, receiver, sender, receiver, 501))

      let receiverBalance = await getTokenBalance(proofToken, receiver)
      let senderBalance = await getTokenBalance(proofToken, sender)

      receiverBalance.should.be.equal(0)
      senderBalance.should.be.equal(1000)
    })

  })
})
