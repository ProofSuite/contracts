const BigNumber = web3.BigNumber
let chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var chaiStats = require('chai-stats')
var chaiBigNumber = require('chai-bignumber')(BigNumber)
chai.use(chaiAsPromised).use(chaiBigNumber).use(chaiStats).should()

import {
  ether,
  DEFAULT_GAS,
  DEFAULT_GAS_PRICE
} from '../scripts/testConfig.js'

import {
  getAddress,
  expectInvalidOpcode,
  advanceToBlock
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
  buyTokens
} from '../scripts/tokenSaleHelpers.js'

import {
  transferOwnership
} from '../scripts/ownershipHelpers.js'

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
  let hacker1 = accounts[3]
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
      endBlock
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
      await transferOwnership(proofToken, fund, tokenSaleAddress)
      await advanceToBlock(startBlock)
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
      let initialBalance = await getTokenBalance(proofToken, sender)

      let params = { from: sender, gas: DEFAULT_GAS, gasPrice: DEFAULT_GAS_PRICE }
      await expectInvalidOpcode(tokenSale.buyTokens(1, params))

      let balance = await getTokenBalance(proofToken, sender)
      balance.should.be.equal(initialBalance)
    })

    it('buying tokens should be possible if the contract is paused and unpaused', async function() {
      let initialBalance = await getTokenBalance(proofToken, sender)

      await buyTokens(tokenSale, sender, 1 * ether)
      await pause(tokenSale, fund)
      await unpause(tokenSale, fund)
      await buyTokens(tokenSale, sender, 1 * ether)

      let balance = await getTokenBalance(proofToken, sender)
      let balanceIncrease = await baseUnits(proofToken, balance - initialBalance)
      expect(balanceIncrease).to.almost.equal(22.7272727272)
    })
  })
})

