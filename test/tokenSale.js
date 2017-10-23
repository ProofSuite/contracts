const BigNumber = web3.BigNumber
let chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var chaiStats = require('chai-stats')
var chaiBigNumber = require('chai-bignumber')(BigNumber)
chai.use(chaiAsPromised).use(chaiBigNumber).use(chaiStats).should()

import moment from 'moment'
import { TOKENS_ALLOCATED_TO_PROOF, ether } from '../scripts/testConfig.js'
import { getAddress, advanceToBlock, expectInvalidOpcode, waitUntilTransactionsMined, latestTime, increaseTime } from '../scripts/helpers.js'
import { baseUnits, mintToken, getTokenBalance, getTotalSupply } from '../scripts/tokenHelpers.js'
import { transferControl } from '../scripts/controlHelpers.js'
import { buyTokens, finalize, getCap, getPrice, getPriceInWei, getBasePrice, getBasePriceInWei } from '../scripts/tokenSaleHelpers.js'
import { pause, unpause } from '../scripts/pausableHelpers'

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
  let receiver = accounts[2]
  let hacker = accounts[3]
  let wallet = accounts[5]
  let proofWalletAddress = accounts[9]

  let startTime
  let endTime
  let contractUploadTime

  beforeEach(async function() {
    contractUploadTime = latestTime()
    startTime = contractUploadTime.add(1, 'day').unix()
    endTime = contractUploadTime.add(31, 'day').unix()

    proofPresaleToken = await ProofPresaleToken.new()
    proofPresaleTokenAddress = await getAddress(proofPresaleToken)

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
      proofTokenAddress,
      startTime,
      endTime)

    tokenSaleAddress = await getAddress(tokenSale)
  })

  describe('Token Information', async function() {
    beforeEach(async function() {
      await transferControl(proofToken, fund, tokenSaleAddress)
      await increaseTime(moment.duration(1.01, 'day'))
    })

    it('should return the correct token supply', async function() {
      await buyTokens(tokenSale, sender, 1 * ether)

      let supply = await getTotalSupply(proofToken)
      let tokenSaleDisplaySupply = await getTotalSupply(tokenSale)
      supply.should.be.equal(tokenSaleDisplaySupply)
    })

    // the token balance of each token holder can also be displayed via the token sale contract - by routing towards the proof token balanceOf() method
    // we verify both balances are equal
    it('should return the correct token balance (tokenSale.balanceOf must be equal to proofToken.balanceOf)', async function() {
      await buyTokens(tokenSale, sender, 1 * ether)
      let senderBalance = await getTokenBalance(proofToken, sender)
      let senderDisplayBalance = await getTokenBalance(tokenSale, sender)
      senderBalance.should.be.equal(senderDisplayBalance)
    })
  })

  describe('Initial State', function () {
    beforeEach(async function() {
      await transferControl(proofToken, fund, tokenSaleAddress)
      await increaseTime(moment.duration(1.01, 'day'))
    })

    it('should initially set the token wallet', async function() {
      let tokenSaleWallet = await tokenSale.PROOF_TOKEN_WALLET.call()
      tokenSaleWallet.should.be.equal('Correct wallet address')
    })

    it('should initially set the multisig', async function() {
      let tokenSaleWallet = await tokenSale.PROOF_MULTISIG.call()
      tokenSaleWallet.should.be.equal('Correct wallet address')
    })

    it('should initially be linked to the Proof token', async function() {
      let tokenSaleToken = await tokenSale.proofToken.call()
      tokenSaleToken.should.be.equal(proofTokenAddress)
    })

    it('Initial Price should be equal to 0.0748 ether', async function() {
      let price = await getPrice(tokenSale)
      expect(price).almost.equal(0.85 * 0.088)
    })

    it('Base Price should be equal to 0.088 ether', async function() {
      let price = await getBasePrice(tokenSale)
      price.should.be.equal(0.088)
    })

    it('cap should be equal to remaining tokens adjusted to multiplier', async function() {
      let cap = await getCap(tokenSale)
      cap.should.be.equal(1068644)
    })
  })

  describe('Finalized state', function () {
    beforeEach(async function() {

      contractUploadTime = latestTime()
      startTime = contractUploadTime.add(1, 'day').unix()
      endTime = contractUploadTime.add(31, 'day').unix()
      proofPresaleToken = await ProofPresaleToken.new()
      proofPresaleTokenAddress = await getAddress(proofPresaleToken)

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
        proofTokenAddress,
        startTime,
        endTime)

      tokenSaleAddress = await getAddress(tokenSale)
      transferControl(proofToken, fund, tokenSaleAddress)
    })

    it('should initially not be finalized', async function() {
      let finalized = await tokenSale.finalized.call()
      finalized.should.be.false
    })

    it('should not be finalizeable if the token sale is not paused', async function() {
      await expectInvalidOpcode(finalize(tokenSale, fund))
      let finalized = await tokenSale.finalized.call()
      finalized.should.be.false
    })

    it('should be finalizeable if the token sale is paused', async function() {
      await pause(tokenSale, fund)
      await finalize(tokenSale, fund)
      let finalized = await tokenSale.finalized.call()
      finalized.should.be.true
    })

    it('should not be finalizeable if the token sale is paused/unpaused', async function() {
      await pause(tokenSale, fund)
      await unpause(tokenSale, fund)
      await expectInvalidOpcode(finalize(tokenSale, fund))
      let finalized = await tokenSale.finalized.call()
      finalized.should.be.false
    })

    it('should not be finalizeable by non-owner', async function() {
      await pause(tokenSale, fund)
      await expectInvalidOpcode(finalize(tokenSale, hacker))
      let finalized = await tokenSale.finalized.call()
      finalized.should.be.false
    })

  })
})
