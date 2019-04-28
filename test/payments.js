const BigNumber = web3.BigNumber
let chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var chaiStats = require('chai-stats')
var chaiBigNumber = require('chai-bignumber')(BigNumber)
chai.use(chaiAsPromised).use(chaiBigNumber).use(chaiStats).should()

import moment from 'moment'

import { DEFAULT_GAS,
         DEFAULT_GAS_PRICE,
         ether } from '../scripts/testConfig.js'

import { getAddress,
         sendTransaction,
         expectInvalidOpcode,
         getBalance,
         advanceToBlock,
         latestTime,
         increaseTime } from '../scripts/helpers.js'

import { getTotalSupply,
         getTokenBalance,
         baseUnits } from '../scripts/tokenHelpers.js'

import { buyTokens,
         numberOfTokensFor,
         getWallet,
         getBasePriceInWei,
         getPriceInWei,
         getMultisig,
         getCap,
         getContributors,
         enableTransfers } from '../scripts/tokenSaleHelpers.js'

import { transferControl } from '../scripts/controlHelpers.js'

const assert = chai.assert
const should = chai.should()
const expect = chai.expect

const Token = artifacts.require('./Token.sol')
const TokenSale = artifacts.require('./TokenSale.sol')

contract('Crowdsale', (accounts) => {
  let fund = accounts[0]
  let tokenSale
  let tokenSaleAddress
  let Token
  let TokenAddress
  let sender = accounts[1]
  let wallet = accounts[5]

  let startTime
  let endTime
  let contractUploadTime

  beforeEach(async function() {

    Token = await Token.new(
      '0x0',
      '0x0',
      0,
      'WIRA Token Test',
      'WIRA Test'
    )

    TokenAddress = await getAddress(Token)

    contractUploadTime = latestTime()
    startTime = contractUploadTime.add(1, 'day').unix()
    endTime = contractUploadTime.add(31, 'day').unix()

    tokenSale = await TokenSale.new(
      TokenAddress,
      startTime,
      endTime)


    tokenSaleAddress = await getAddress(tokenSale)

  })

  describe('Starting and Ending Period', async function() {
    beforeEach(async function() {
      await transferControl(Token, fund, tokenSaleAddress)
      await enableTransfers(tokenSale, fund)
    })

    it('should reject payments before start', async function() {
      await increaseTime(moment.duration(0.99, 'day'))
      await expectInvalidOpcode(tokenSale.buyTokens(sender, { value: 1 * ether, from: sender }))
      await expectInvalidOpcode(tokenSale.send(1 * ether, { from: sender }))
    })

    it('should accepts payments after start', async function() {
      await increaseTime(moment.duration(1.01, 'day'))
      await tokenSale.send(1 * ether, { from: sender }).should.be.fulfilled
      await tokenSale.buyTokens(sender, { value: 1 * ether, from: sender }).should.be.fulfilled
    })

    it('should reject payments after end', async function() {
      await increaseTime(moment.duration(33, 'day'))
      await expectInvalidOpcode(tokenSale.send(1 * ether, { from: sender }))
      await expectInvalidOpcode(tokenSale.buyTokens(sender, { value: 1 * ether, from: sender }))
    })
  })

  describe('Payments', async function() {
    beforeEach(async function() {
      await transferControl(Token, fund, tokenSaleAddress)
      await enableTransfers(tokenSale, fund)
      await increaseTime(moment.duration(1.01, 'day'))
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
      let initialTotalSupply = await getTotalSupply(Token)

      await buyTokens(tokenSale, sender, 1 * ether)

      let expectedSupplyIncrease = await numberOfTokensFor(tokenSale, 1 * ether)
      expectedSupplyIncrease = await baseUnits(Token, expectedSupplyIncrease)

      let totalSupply = await getTotalSupply(Token)

      let supplyIncrease = (totalSupply - initialTotalSupply)
      supplyIncrease = await baseUnits(Token, supplyIncrease)

      expect(supplyIncrease).to.almost.equal(expectedSupplyIncrease)
    })

    it('should increase total supply by 13.368 for 10 ether raised', async function() {
      let initialTotalSupply = await getTotalSupply(Token)

      await buyTokens(tokenSale, sender, 1 * ether)

      let totalSupply = await getTotalSupply(Token)
      let supplyIncrease = (totalSupply - initialTotalSupply)
      supplyIncrease = await baseUnits(Token, supplyIncrease)

      expect(supplyIncrease).almost.equal(13.36898395)
    })

    it('should transfer money to the wallet after receiving investment', async function() {
      let multisig = await getMultisig(tokenSale)
      let initialBalance = await getBalance(multisig)
      await buyTokens(tokenSale, sender, 1 * ether)

      let balance = await getBalance(multisig)
      let balanceIncrease = (balance - initialBalance) / (1 * ether)
      expect(balanceIncrease).almost.equal(1, 3)
    })

    it('should create tokens for the sender', async function() {
      let initialTokenBalance = await getTokenBalance(Token, sender)

      await buyTokens(tokenSale, sender, 1 * ether)

      let tokenBalance = await getTokenBalance(Token, sender)
      let balanceIncrease = await baseUnits(Token, tokenBalance - initialTokenBalance)

      let expectedBalanceIncrease = await numberOfTokensFor(tokenSale, 1 * ether)
      expectedBalanceIncrease = await baseUnits(Token, expectedBalanceIncrease)

      expect(balanceIncrease).to.almost.equal(expectedBalanceIncrease)
    })

    it('should increase buyer balance by 13.36898395 for 10 ether invested', async function() {
      let initialTokenBalance = await getTokenBalance(Token, sender)

      await buyTokens(tokenSale, sender, 1 * ether)

      let tokenBalance = await getTokenBalance(Token, sender)
      let balanceIncrease = (tokenBalance - initialTokenBalance)
      balanceIncrease = await baseUnits(Token, balanceIncrease)
      expect(balanceIncrease).almost.equal(13.36898395)
    })
  })

  describe('Price', function () {

    beforeEach(async function() {
      await transferControl(Token, fund, tokenSaleAddress)
      await enableTransfers(tokenSale, fund)
      await increaseTime(moment.duration(1.01, 'day'))
    })

    it('should initially return 15% premium price', async function() {
      let price = await getPriceInWei(tokenSale)
      let expectedPrice = 74800000000000000
      price.should.be.equal(expectedPrice)
    })

    it('should return 10% premium price after 5% of the tokens have been bought', async function() {
      let basePriceInWei = await getBasePriceInWei(tokenSale)
      let cap = await getCap(tokenSale)
      let capInWei = cap * basePriceInWei
      let investment = 0.05 * capInWei
      await buyTokens(tokenSale, sender, investment)

      let priceInWei = await getPriceInWei(tokenSale)
      let expectedPrice = 74800000000000000
      priceInWei.should.be.equal(expectedPrice)
    })

    it('should return 5% premium price after 15% of the tokens have been bought', async function() {
      let basePriceInWei = await getBasePriceInWei(tokenSale)
      let cap = await getCap(tokenSale)
      let capInWei = cap * basePriceInWei
      let investment = 0.15 * capInWei

      await buyTokens(tokenSale, sender, investment)

      let priceInWei = await getPriceInWei(tokenSale)
      let expectedPrice = 83600000000000000
      priceInWei.should.be.equal(expectedPrice)
    })

    it('should return full price after 25% of the tokens have been sold', async function() {
      let basePriceInWei = await getBasePriceInWei(tokenSale)
      let cap = await getCap(tokenSale)
      let capInWei = cap * basePriceInWei
      let investment = 0.25 * capInWei

      await buyTokens(tokenSale, sender, investment)

      let priceInWei = await getPriceInWei(tokenSale)
      let expectedPrice = 88000000000000000
      priceInWei.should.be.equal(expectedPrice)
    })
  })

  describe('Buying Tokens', async function() {
    beforeEach(async function() {
      await transferControl(Token, fund, tokenSaleAddress)
      await increaseTime(moment.duration(1.01, 'day'))
    })

    it('should offer 14.20 tokens for 1 ether invested if less than 5% of the tokens were sold', async function() {
      let initialTokenBalance = await getTokenBalance(Token, sender)

      await buyTokens(tokenSale, sender, 1 * ether)

      let tokenBalance = await getTokenBalance(Token, sender)
      let balanceIncrease = (tokenBalance - initialTokenBalance)
      balanceIncrease = await baseUnits(Token, balanceIncrease)
      let expectedBalanceIncrease = 13.368983957219
      expect(balanceIncrease).almost.equal(expectedBalanceIncrease)
    })

    it('should offer 12.62 tokens for 1 ether invested if less than 15% of the tokens were sold', async function() {
      let basePriceInWei = await getBasePriceInWei(tokenSale)
      let cap = await getCap(tokenSale)
      let capInWei = cap * basePriceInWei
      let investment = 0.14 * capInWei
      await buyTokens(tokenSale, fund, investment)

      let initialTokenBalance = await getTokenBalance(Token, sender)

      await buyTokens(tokenSale, sender, 1 * ether)

      let tokenBalance = await getTokenBalance(Token, sender)
      let balanceIncrease = (tokenBalance - initialTokenBalance)
      balanceIncrease = await baseUnits(Token, balanceIncrease)
      let expectedBalanceIncrease = 11.9617224880
      expect(balanceIncrease).almost.equal(expectedBalanceIncrease)
    })

    it('should offer 11.96 tokens for 1 ether invested if less than 25% of the tokens were sold', async function() {
      let basePriceInWei = await getBasePriceInWei(tokenSale)
      let cap = await getCap(tokenSale)
      let capInWei = cap * basePriceInWei
      let investment = 0.24 * capInWei
      await buyTokens(tokenSale, fund, investment)

      let initialTokenBalance = await getTokenBalance(Token, sender)

      await buyTokens(tokenSale, sender, 1 * ether)

      let tokenBalance = await getTokenBalance(Token, sender)
      let balanceIncrease = (tokenBalance - initialTokenBalance)
      balanceIncrease = await baseUnits(Token, balanceIncrease)
      let expectedBalanceIncrease = 11.363636363636
      expect(balanceIncrease).almost.equal(expectedBalanceIncrease)
    })

    it('should throw if the number of tokens exceeds the cap', async function() {
      let basePriceInWei = await getBasePriceInWei(tokenSale)
      let cap = await getCap(tokenSale)
      let initialBalance = await getTokenBalance(Token, sender)

      let amount = 0.85 * cap * basePriceInWei * (1.001)
      let params = { value: amount, gas: DEFAULT_GAS, gasPrice: DEFAULT_GAS_PRICE }
      await expectInvalidOpcode(tokenSale.buyTokens(sender, params))

      let balance = await getTokenBalance(Token, sender)
      balance.should.be.equal(initialBalance)
    })

    it('should not throw if the number of tokens hits just below the cap', async function() {
      let basePriceInWei = await getBasePriceInWei(tokenSale)
      let cap = await getCap(tokenSale)
      let initialBalance = await getTokenBalance(Token, sender)

      let amount = 0.85 * cap * basePriceInWei * (0.999)
      let params = { value: amount, gas: DEFAULT_GAS, gasPrice: DEFAULT_GAS_PRICE }
      tokenSale.buyTokens(sender, params).should.be.fulfilled
    })

    it('should increase the number of contributors by 1', async function() {
      let initialContributors = await getContributors(tokenSale)
      await buyTokens(tokenSale, sender, 1 * ether)
      let contributors = await getContributors(tokenSale)
      contributors.should.be.equal(initialContributors + 1)
    })

  })
})
