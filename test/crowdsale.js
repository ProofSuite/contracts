const BigNumber = web3.BigNumber
let chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var chaiStats = require('chai-stats')
var chaiBigNumber = require('chai-bignumber')(BigNumber)
chai.use(chaiAsPromised).use(chaiBigNumber).use(chaiStats).should()

import { investment,
         smallInvestment,
         hugeInvestment } from '../scripts/testConfig.js'

import { deployContract,
         getAddress,
         expectInvalidOpcode,
         waitUntilTransactionsMined,
         getBalance } from '../scripts/helpers.js'

import { pause,
         unpause } from '../scripts/pausableHelpers.js'

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
  let sender = accounts[1]
  let receiver = accounts[2]
  let hacker1 = accounts[3]
  let hacker2 = accounts[4]

  beforeEach(async function() {
    let proofPresaleToken = await deployContract(ProofPresaleToken)
    let proofPresaleTokenAddress = await getAddress(proofPresaleToken)

    let proofToken = await deployContract(ProofToken, proofPresaleTokenAddress)
    let proofTokenAddress = await getAddress(proofToken)

    tokenSale = await deployContract(
      TokenSale,
      proofTokenAddress,
      proofPresaleTokenAddress)
  })

  describe('Ownership', function () {
    it('should initially belong to contract caller', async function() {
      let owner = await tokenSale.owner.call()
      assert.equal(owner, fund)
    })

    it('should be transferable to another account', async function() {
      let owner = await tokenSale.owner.call()
      await transferOwnership(tokenSale, owner, receiver)
      let newOwner = await tokenSale.owner.call()
      assert.equal(newOwner, receiver)
    })

    it('should not be transferable by non-owner', async function() {
      let owner = await tokenSale.owner.call()
      await expectInvalidOpcode(transferOwnership(tokenSale, hacker1, hacker2))
      const newOwner = await tokenSale.owner.call()
      assert.equal(owner, newOwner)
    })
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
      let proofPresaleToken = await deployContract(ProofPresaleToken)
      let proofPresaleTokenAddress = await getAddress(proofPresaleToken)

      let proofToken = await deployContract(ProofToken, proofPresaleTokenAddress)
      let proofTokenAddress = await getAddress(proofToken)

      tokenSale = await deployContract(
        TokenSale,
        proofTokenAddress,
        proofPresaleTokenAddress)
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
  })

  describe('Crowdsale', async function() {

    let txn
    let txnObj
    let params

    it('accepts payments', async function() {
      txnObj = { from: sender, to: tokenSale.address, value: investment, gas: 1000000, gasPrice: 600000000 }
      await makeTransaction(txnObj).should.be.fulfilled
      params = { from: sender, gas: 1000000, value: investment }
      await this.crowdsale.buyTokens(sender, params).should.be.fulfilled
    })

    it('should not accept huge payments', async function() {
      let walletBalanceBefore = getBalance(this.wallet)
      await expectInvalidOpcode(this.crowdsale.send(hugeInvestment, { from: sender }))
      let walletBalanceAfter = getBalance(this.wallet)
      expect(walletBalanceAfter).equals(walletBalanceBefore)
    })

    it('should increase total token supply', async function() {
      let totalSupplyBefore = await this.token.totalSupply.call()

      params = { from: sender, gas: 1000000, gasPrice: 600000000, value: investment }
      txn = await this.crowdsale.buyTokens(sender, params)
      await waitUntilTransactionsMined(txn.tx)

      let totalSupplyAfter = await this.token.totalSupply.call()
      let tokenDifference = Number((totalSupplyAfter - totalSupplyBefore).toString())
      let expectedTokenDifference = equivalentTokenBaseUnits(investment)

      tokenDifference.should.be.equal(expectedTokenDifference)
    })

    it('should increase total supply by 200 for 10 ether raised', async function() {
      let totalSupplyBefore = await this.token.totalSupply.call()

      params = { from: sender, gas: 1000000, gasPrice: 600000000, value: investment }
      txn = await this.crowdsale.buyTokens(sender, params)
      await waitUntilTransactionsMined(txn.tx)

      let totalSupplyAfter = await this.token.totalSupply.call()
      let tokenDifference = Number((totalSupplyAfter - totalSupplyBefore).toString())

      tokenDifference.should.be.equal(200 * (10 ** 18))
    })

    it('should transfer money to the wallet after receiving investment', async function() {
      let walletBalanceBefore = getBalance(this.wallet)
      let txn = await this.crowdsale.send(investment, { from: sender, gas: 100000, gasPrice: 600000000 })
      waitUntilTransactionsMined(txn)
      let walletBalanceAfter = getBalance(this.wallet)
      let amountReceived = inWei(walletBalanceAfter - walletBalanceBefore)

      amountReceived.should.be.equal(investment)
    })

    it('should create tokens for the sender', async function() {
      let tokenBalanceBefore = await this.token.balanceOf(sender)

      txnObj = { from: sender, to: this.crowdsale.address, value: investment, gas: 1000000, gasPrice: 600000000 }
      txn = await makeTransaction(txnObj)
      await waitUntilTransactionsMined(txn)

      let tokenBalanceAfter = await this.token.balanceOf(sender)
      let tokenDifference = tokenBalanceAfter - tokenBalanceBefore
      let expectedTokenUnitsDifference = equivalentTokenBaseUnits(investment)

      tokenDifference.should.be.equal(expectedTokenUnitsDifference)
    })

    it('should create 200 tokens for the sender for 10 ether invested', async function() {
      let tokenBalanceBefore = await this.token.balanceOf(sender)

      txnObj = { from: sender, to: this.crowdsale.address, value: investment, gas: 2000000, gasPrice: 600000000 }
      txn = await makeTransaction(txnObj)
      await waitUntilTransactionsMined(txn)

      let tokenBalanceAfter = await this.token.balanceOf(sender)
      let tokenDifference = tokenBalanceAfter - tokenBalanceBefore

      tokenDifference.should.be.equal(200 * (10 ** 18))
    })

    it('should own the proof presale token', async function() {
      let tokenOwner = await this.token.owner.call()
      let crowdsaleAddress = this.crowdsale.address

      tokenOwner.should.be.equal(crowdsaleAddress)

      let tokenAddress = this.token.address
      let crowdsaleToken = await this.crowdsale.token.call()

      tokenAddress.should.be.equal(crowdsaleToken)
    })
  })

})

//   describe('Halted', function () {
//     let txnObj
//     let txn

//     beforeEach(async function () {
//       let wallet = '0xe2b3204f29ab45d5fd074ff02ade098fbc381d42'
//       this.crowdsale = await Crowdsale.new(wallet, 10, 295257, 20)
//       this.token = ProofPresaleToken.at(await this.crowdsale.token())
//       owner = await this.crowdsale.owner.call()
//       this.wallet = await this.crowdsale.wallet.call()
//       this.cap = await this.crowdsale.cap.call()
//       this.rate = await this.crowdsale.rate.call()
//       this.etherCap = (this.cap) / (this.rate)
//       this.receiver = accounts[1]
//       this.hacker_1 = accounts[2]
//       this.hacker_2 = accounts[3]
//     })

//     it('should not be ended if pre-sale funding objective is not reached', async function() {
//       let ended = await this.crowdsale.hasEnded()
//       ended.should.be.false
//     })

//     it('should be ended if pre-sale funding objective is reached', async function() {
//       txnObj = { from: sender, to: this.crowdsale.address, value: this.etherCap, gas: 200000 }

//       txn = await h.makeTransaction(txnObj)
//       await h.waitUntilTransactionsMined(txn)

//       let ended = await this.crowdsale.hasEnded()
//       ended.should.be.true
//     })
//   })
// })

// contract('ProofPresaleToken', (accounts) => {
//   const firstInvestor = accounts[1]
//   const secondInvestor = accounts[2]
//   const receiver = accounts[3]
//   const hacker = accounts[4]

//   let token
//   let params
//   let owner
//   let units

//   describe('Token', function () {
//     beforeEach(async function() {
//       token = await ProofPresaleToken.new()
//       owner = await token.owner.call()
//       units = h.inBaseUnits(10)
//     })

//     it('should start with a totalSupply of 0', async function() {
//       let totalSupply = await token.totalSupply()
//       totalSupply = totalSupply.toNumber()
//       totalSupply.should.be.equal(0)
//     })

//     it('should return mintingFinished false after construction', async function() {
//       let mintingFinished = await token.mintingFinished()
//       mintingFinished.should.be.false
//     })

//     it('should be mintable by owner contract', async function() {
//       units = h.inBaseUnits(10)

//       let txn = await token.mint(receiver, units, { from: owner, gas: 1000000 })
//       await h.waitUntilTransactionsMined(txn.tx)

//       let receiverBalance = await token.balanceOf(receiver)

//       receiverBalance = receiverBalance.toNumber()
//       receiverBalance.should.be.equal(units)
//     })

//     it('should not be mintable by non-owner contract', async function() {
//       units = h.inBaseUnits(10)
//       params = { from: hacker, gas: 100000 }

//       await h.expectInvalidOpcode(token.mint(receiver, units, params))

//       let hackerBalance = await token.balanceOf(hacker)
//       hackerBalance = hackerBalance.toNumber()
//       hackerBalance.should.be.equal(0)
//     })

//     it('should be transferable ', async function() {
//       units = h.inBaseUnits(50)

//       let txn1 = await token.mint(firstInvestor, units, { from: owner, gas: 1000000 })
//       await h.waitUntilTransactionsMined(txn1.tx)

//       let firstInvestorBalanceBefore = await token.balanceOf(firstInvestor)
//       let secondInvestorBalanceBefore = await token.balanceOf(secondInvestor)

//       let txn2 = await token.transfer(secondInvestor, units, { from: firstInvestor, gas: 1000000 })
//       await h.waitUntilTransactionsMined(txn2.tx)

//       let firstInvestorBalanceAfter = await token.balanceOf(firstInvestor)
//       let secondInvestorBalanceAfter = await token.balanceOf(secondInvestor)

//       let firstInvestorBalanceDifference = firstInvestorBalanceAfter - firstInvestorBalanceBefore
//       let secondInvestorBalanceDifference = secondInvestorBalanceAfter - secondInvestorBalanceBefore

//       firstInvestorBalanceDifference.should.be.equal(-units)
//       secondInvestorBalanceDifference.should.be.equal(units)
//     })

//     it('should not allow to transfer more than balance', async function() {
//       let investorBalance = await token.balanceOf(firstInvestor)
//       let txn = await token.mint(firstInvestor, investorBalance + 1, { from: owner, gas: 1000000 })
//       await h.waitUntilTransactionsMined(txn.tx)

//       params = { from: firstInvestor, gas: 100000 }
//       await h.expectInvalidOpcode(token.transfer(secondInvestor, units, params))
//     })
//   })
// })
