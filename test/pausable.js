const BigNumber = web3.BigNumber
let chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var chaiStats = require('chai-stats')
var chaiBigNumber = require('chai-bignumber')(BigNumber)
chai.use(chaiAsPromised).use(chaiBigNumber).use(chaiStats).should()

import moment from 'moment'

import {
  ether,
  DEFAULT_GAS,
  DEFAULT_GAS_PRICE
} from '../scripts/testConfig.js'

import {
  getAddress,
  expectInvalidOpcode,
  latestTime,
  increaseTime
} from '../scripts/helpers.js'

import {
  pause,
  unpause
} from '../scripts/pausableHelpers.js'

import {
  getTokenBalance,
  baseUnits
} from '../scripts/tokenHelpers.js'

import {
  buyTokens,
  enableTransfers,
  lockTransers,
  enableMasterTransfers,
  lockMasterTransfers
} from '../scripts/tokenSaleHelpers.js'

import {
  transferOwnership
} from '../scripts/ownershipHelpers.js'

import {
  transferControl
} from '../scripts/controlHelpers.js'

const assert = chai.assert
const should = chai.should()
const expect = chai.expect

const ProofPresaleToken = artifacts.require('./ProofPresaleToken.sol')
const Token = artifacts.require('./Token.sol')
const TokenSale = artifacts.require('./TokenSale.sol')

contract('Crowdsale', (accounts) => {
  let fund = accounts[0]
  let tokenSale
  let tokenSaleAddress
  let Token
  let proofPresaleToken
  let proofPresaleTokenAddress
  let TokenAddress
  let sender = accounts[1]
  let hacker1 = accounts[3]
  let wallet = accounts[5]
  let proofWalletAddress = accounts[9]

  let startTime
  let endTime
  let contractUploadTime

  beforeEach(async function() {


    proofPresaleToken = await ProofPresaleToken.new()
    proofPresaleTokenAddress = await getAddress(proofPresaleToken)

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
      endTime
    )

    tokenSaleAddress = await getAddress(tokenSale)
  })

  describe('Pause', function () {
    after(async function() {
      let crowdsalePaused = await tokenSale.paused.call()
      let owner = await tokenSale.owner.call()
      if (crowdsalePaused) {
        await unpause(tokenSale, owner)
      }
    })

    beforeEach(async function() {
      await transferControl(Token, fund, tokenSaleAddress)
      await enableTransfers(tokenSale, fund)
      await increaseTime(moment.duration(1.01, 'day'))
    })

    it('can be paused and unpaused by the owner', async function() {
      let crowdsalePaused = await tokenSale.paused.call()
      let owner = await tokenSale.owner.call()

      if (crowdsalePaused) {
        await unpause(tokenSale, owner)
        crowdsalePaused = await tokenSale.paused.call()
        expect(crowdsalePaused).to.be.false
      }

      await pause(tokenSale, owner)
      crowdsalePaused = await tokenSale.paused.call()
      expect(crowdsalePaused).to.be.true

      await unpause(tokenSale, owner)
      crowdsalePaused = await tokenSale.paused.call()
      expect(crowdsalePaused).to.be.false
    })

    it('can not be paused non-owner', async function() {
      let crowdsalePaused = await tokenSale.paused.call()
      let owner = await tokenSale.owner.call()

      // we initially unpause the contract before we carry out the test
      if (crowdsalePaused) {
        await unpause(tokenSale, owner)
        crowdsalePaused = await tokenSale.paused.call()
        expect(crowdsalePaused).to.be.false
      }

      await expectInvalidOpcode(pause(tokenSale, hacker1))
      crowdsalePaused = await tokenSale.paused.call()
      expect(crowdsalePaused).to.be.false
    })

    it('can not be unpaused non-owner', async function() {
      let crowdsalePaused = await tokenSale.paused.call()
      let owner = await tokenSale.owner.call()

      // we initially unpause the contract before we carry out the test
      if (!crowdsalePaused) {
        await pause(tokenSale, owner)
        crowdsalePaused = await tokenSale.paused.call()
        expect(crowdsalePaused).to.be.true
      }

      await expectInvalidOpcode(pause(tokenSale, hacker1))
      crowdsalePaused = await tokenSale.paused.call()
      expect(crowdsalePaused).to.be.true
    })

    it('buying tokens should not be possible if the contract is paused', async function() {
      await pause(tokenSale, fund)
      let initialBalance = await getTokenBalance(Token, sender)

      let params = { from: sender, gas: DEFAULT_GAS, gasPrice: DEFAULT_GAS_PRICE }
      await expectInvalidOpcode(tokenSale.buyTokens(1, params))

      let balance = await getTokenBalance(Token, sender)
      balance.should.be.equal(initialBalance)
    })

    it('buying tokens should be possible if the contract is paused and unpaused', async function() {
      let initialBalance = await getTokenBalance(Token, sender)

      await buyTokens(tokenSale, sender, 1 * ether)
      await pause(tokenSale, fund)
      await unpause(tokenSale, fund)
      await buyTokens(tokenSale, sender, 1 * ether)

      let balance = await getTokenBalance(Token, sender)
      let balanceIncrease = await baseUnits(Token, balance - initialBalance)
      expect(balanceIncrease).to.almost.equal(26.737967914)
    })
  })
})

