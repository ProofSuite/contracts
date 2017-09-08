const BigNumber = web3.BigNumber
let chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var chaiStats = require('chai-stats')
var chaiBigNumber = require('chai-bignumber')(BigNumber)
chai.use(chaiAsPromised).use(chaiBigNumber).use(chaiStats).should()

import { DEFAULT_GAS,
         DEFAULT_GAS_PRICE,
         ether } from '../scripts/testConfig.js'

import { getAddress,
         sendTransaction,
         expectInvalidOpcode,
         getBalance,
         advanceToBlock } from '../scripts/helpers.js'

import { getTotalSupply,
         getTokenBalance,
         baseUnits } from '../scripts/tokenHelpers.js'

import { buyTokens,
         numberOfTokensFor,
         getWallet,
         getPriceInWei,
         getCap } from '../scripts/tokenSaleHelpers.js'

import { transferOwnership } from '../scripts/ownershipHelpers.js'

const assert = chai.assert
const should = chai.should()
const expect = chai.expect

const ProofPresaleToken = artifacts.require('./ProofPresaleToken.sol')
const ProofToken = artifacts.require('./ProofToken.sol')
const TokenSale = artifacts.require('./TokenSale.sol')

contract('Crowdsale', (accounts) => {
  let fund = accounts[0]
  let tokenSale
  let tokenSaleAddress
  let proofToken
  let proofPresaleToken
  let proofPresaleTokenAddress
  let proofTokenAddress
  let sender = accounts[1]
  let wallet = accounts[5]
  let proofWalletAddress = accounts[9]

  let startBlock
  let endBlock

  beforeEach(async function() {

    startBlock = web3.eth.blockNumber + 10
    endBlock = web3.eth.blockNumber + 20

    proofPresaleToken = await ProofPresaleToken.new()
    proofPresaleTokenAddress = await getAddress(proofPresaleToken)

    proofToken = await ProofToken.new(proofPresaleTokenAddress, proofWalletAddress)
    proofTokenAddress = await getAddress(proofToken)

    tokenSale = await TokenSale.new(
      wallet,
      proofTokenAddress,
      startBlock,
      endBlock)

    tokenSaleAddress = await getAddress(tokenSale)
  })

  describe('Starting and Ending Period', async function() {
    beforeEach(async function() {
      await transferOwnership(proofToken, fund, tokenSaleAddress)
    })

    it('should reject payments before start', async function() {
      await expectInvalidOpcode(tokenSale.buyTokens(sender, { value: 1 * ether, from: sender }))
      await expectInvalidOpcode(tokenSale.send(1 * ether, { from: sender }))
    })

    it('should accepts payments after start', async function() {
      await advanceToBlock(startBlock)
      await tokenSale.send(1 * ether, { from: sender }).should.be.fulfilled
      await tokenSale.buyTokens(sender, { value: 1 * ether, from: sender }).should.be.fulfilled
    })

    it('should reject payments after end', async function() {
      await advanceToBlock(endBlock)
      await expectInvalidOpcode(tokenSale.send(1 * ether, { from: sender }))
      await expectInvalidOpcode(tokenSale.buyTokens(sender, { value: 1 * ether, from: sender }))
    })
  })

  describe('Payments', async function() {
    beforeEach(async function() {
      await transferOwnership(proofToken, fund, tokenSaleAddress)
      await advanceToBlock(startBlock)
    })

    it('should accepts ether transactions sent to contract', async function() {
      let order = { from: sender,
        to: tokenSaleAddress,
        value: 1 * ether,
        gas: DEFAULT_GAS,
        gasPrice: DEFAULT_GAS_PRICE
      }

      await sendTransaction(order).should.be.fulfilled
    })

    it('should accept ether through buyTokens function', async function() {
      let order = {
        from: sender,
        value: 1 * ether,
        gas: DEFAULT_GAS,
        gasPrice: DEFAULT_GAS_PRICE
      }

      await tokenSale.buyTokens(sender, order).should.be.fulfilled
    })

    it('should increase total token supply', async function() {
      let initialTotalSupply = await getTotalSupply(proofToken)

      await buyTokens(tokenSale, sender, 1 * ether)

      let expectedSupplyIncrease = await numberOfTokensFor(tokenSale, 1 * ether)
      expectedSupplyIncrease = await baseUnits(proofToken, expectedSupplyIncrease)

      let totalSupply = await getTotalSupply(proofToken)

      let supplyIncrease = (totalSupply - initialTotalSupply)
      supplyIncrease = await baseUnits(proofToken, supplyIncrease)

      expect(supplyIncrease).to.almost.equal(expectedSupplyIncrease)
    })

    it('should increase total supply by 11.36 for 10 ether raised', async function() {
      let initialTotalSupply = await getTotalSupply(proofToken)

      await buyTokens(tokenSale, sender, 1 * ether)

      let totalSupply = await getTotalSupply(proofToken)
      let supplyIncrease = (totalSupply - initialTotalSupply)
      supplyIncrease = await baseUnits(proofToken, supplyIncrease)

      expect(supplyIncrease).almost.equal(11.363636363636)
    })

    it('should transfer money to the wallet after receiving investment', async function() {
      let wallet = await getWallet(tokenSale)
      let initialWalletBalance = getBalance(wallet)
      await buyTokens(tokenSale, sender, 1 * ether)

      let walletBalance = getBalance(wallet)
      let balanceIncrease = (walletBalance - initialWalletBalance) / (1 * ether)
      expect(balanceIncrease).almost.equal(1, 4)
    })

    it('should create tokens for the sender', async function() {
      let initialTokenBalance = await getTokenBalance(proofToken, sender)

      await buyTokens(tokenSale, sender, 1 * ether)

      let tokenBalance = await getTokenBalance(proofToken, sender)
      let balanceIncrease = await baseUnits(proofToken, tokenBalance - initialTokenBalance)

      let expectedBalanceIncrease = await numberOfTokensFor(tokenSale, 1 * ether)
      expectedBalanceIncrease = await baseUnits(proofToken, expectedBalanceIncrease)

      expect(balanceIncrease).to.almost.equal(expectedBalanceIncrease)
    })

    it('should increase buyer balance by X for 10 ether invested', async function() {
      let initialTokenBalance = await getTokenBalance(proofToken, sender)

      await buyTokens(tokenSale, sender, 1 * ether)

      let tokenBalance = await getTokenBalance(proofToken, sender)
      let balanceIncrease = (tokenBalance - initialTokenBalance)
      balanceIncrease = await baseUnits(proofToken, balanceIncrease)
      expect(balanceIncrease).almost.equal(11.363636363636)
    })
  })

  describe('Buying Tokens', async function() {
    beforeEach(async function() {
      await transferOwnership(proofToken, fund, tokenSaleAddress)
      await advanceToBlock(startBlock)
    })

    it('should not throw if purchase hits just below the cap', async function() {
      let cap = await getCap(tokenSale)
      let priceInWei = await getPriceInWei(tokenSale)
      let initialBalance = await getTokenBalance(proofToken, sender)

      let amount = cap * priceInWei - 1
      let expectedTokens = await numberOfTokensFor(tokenSale, amount)

      await buyTokens(tokenSale, sender, amount)

      let balance = await getTokenBalance(proofToken, sender)
      let balanceIncrease = balance - initialBalance

      balanceIncrease.should.be.equal(expectedTokens)
    })

    it('should throw if the number of tokens exceeds the cap', async function() {
      let cap = await getCap(tokenSale)
      let priceInWei = await getPriceInWei(tokenSale)
      let initialBalance = await getTokenBalance(proofToken, sender)

      let amount = cap * priceInWei * (1.001)
      let params = { value: amount, gas: DEFAULT_GAS, gasPrice: DEFAULT_GAS_PRICE }
      await expectInvalidOpcode(tokenSale.buyTokens(sender, params))

      let balance = await getTokenBalance(proofToken, sender)
      balance.should.be.equal(initialBalance)
    })
  })
})
