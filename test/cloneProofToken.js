require('../scripts/jsHelpers.js')

const fs = require('fs')
const csv = require('csv-parser')
const json2csv = require('json2csv')
const ethereumAddress = require('ethereum-address')

const BigNumber = web3.BigNumber
let chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var chaiStats = require('chai-stats')
var chaiBigNumber = require('chai-bignumber')(BigNumber)
chai.use(chaiAsPromised).use(chaiBigNumber).use(chaiStats).should()

import moment from 'moment'

import {
  ether
} from '../scripts/testConfig.js'

import {
  getAddress,
  getTxnReceiptTopics,
  latestTime,
  increaseTime
} from '../scripts/helpers.js'

import {
  cloneToken,
  getTokenBalance,
  getTotalSupply,
  transferToken,
  baseUnits
} from '../scripts/tokenHelpers.js'

import {
  buyTokens,
  enableTransfers
} from '../scripts/tokenSaleHelpers.js'

import {
  transferControl
} from '../scripts/controlHelpers.js'

import {
  decodeEthereumAddress
} from '../scripts/utils.js'

const assert = chai.assert
const should = chai.should()
const expect = chai.expect

const ProofToken = artifacts.require('./ProofToken.sol')
const TokenSale = artifacts.require('./TokenSale.sol')
const TokenFactory = artifacts.require('./TokenFactory.sol')

contract('cloneProofToken', ([fund, buyer, buyer2, wallet]) => {
  let tokenSale
  let proofToken
  let proofTokenFactory
  let proofTokenFactoryAddress

  let proofTokenAddress
  let tokenSaleAddress
  let startTime
  let endTime
  let contractUploadTime

  let txnReceipt
  let topics
  let clonedTokenAddress
  let clonedToken

  beforeEach(async function() {

    proofTokenFactory = await TokenFactory.new()
    proofTokenFactoryAddress = await getAddress(proofTokenFactory)

    proofToken = await ProofToken.new(
      proofTokenFactoryAddress,
      '0x0',
      0,
      'Proof Token',
      'PRFT'
    )

    proofTokenAddress = await getAddress(proofToken)

    contractUploadTime = latestTime()
    startTime = contractUploadTime.add(1, 'day').unix()
    endTime = contractUploadTime.add(1, 'day').unix()

    tokenSale = await TokenSale.new(
      proofTokenAddress,
      startTime,
      endTime
    )

    tokenSaleAddress = await getAddress(tokenSale)

    await transferControl(proofToken, fund, tokenSaleAddress)
    await increaseTime(moment.duration(1.01, 'day'))
  })

  describe('Cloning: ', function () {
    beforeEach(async function() {

      let config = {
        name: 'Proof Token',
        symbol: 'PRFT2',
        block: 0
      }

      await buyTokens(tokenSale, buyer, 1 * ether)

      txnReceipt = await cloneToken(proofToken, fund, config)
      topics = getTxnReceiptTopics(txnReceipt)
      clonedTokenAddress = decodeEthereumAddress(topics[0].parameters[0])
      clonedToken = await ProofToken.at(clonedTokenAddress)
    })

    it('token should be cloneable', async function () {
      let validAddress = ethereumAddress.isAddress(clonedTokenAddress)
      validAddress.should.be.true
    })

    it('cloned token should return identical balances', async function() {
      let balance = await getTokenBalance(proofToken, buyer)
      let clonedBalance = await getTokenBalance(clonedToken, buyer)
      clonedBalance.should.be.equal(balance)
    })

    it('should return identical total supply', async function() {
      let totalSupply = await getTotalSupply(proofToken)
      let clonedTotalSupply = await getTotalSupply(clonedToken)
      clonedTotalSupply.should.be.equal(totalSupply)
    })

    it('should be pluggable and buyable via a new tokensale instance', async function() {

      let clonedTokenSale = await TokenSale.new(
        clonedTokenAddress,
        startTime,
        endTime
      )

      let clonedTokenSaleAddress = await getAddress(clonedTokenSale)
      await transferControl(clonedToken, fund, clonedTokenSaleAddress)

      let initialTokenBalance = await getTokenBalance(clonedToken, buyer2)
      await buyTokens(clonedTokenSale, buyer2, 1 * ether)

      let tokenBalance = await getTokenBalance(clonedToken, buyer2)
      let balanceIncrease = (tokenBalance - initialTokenBalance)
      balanceIncrease = await baseUnits(clonedToken, balanceIncrease)
      expect(balanceIncrease).almost.equal(13.3689839572)
    })

    it('cloned tokens should be transferable', async function() {

      let clonedTokenSale = await TokenSale.new(
        clonedTokenAddress,
        startTime,
        endTime
      )

      let clonedTokenSaleAddress = await getAddress(clonedTokenSale)
      await transferControl(clonedToken, fund, clonedTokenSaleAddress)
      await enableTransfers(clonedTokenSale, fund)
      let buyer1InitialBalance = await getTokenBalance(clonedToken, buyer)
      let buyer2InitialBalance = await getTokenBalance(clonedToken, buyer2)

      await transferToken(clonedToken, buyer, buyer2, 100)

      let buyer1Balance = await getTokenBalance(clonedToken, buyer)
      let buyer2Balance = await getTokenBalance(clonedToken, buyer2)

      buyer1Balance.should.be.equal(buyer1InitialBalance - 100)
      buyer2Balance.should.be.equal(buyer2InitialBalance + 100)
    })
  })
})
