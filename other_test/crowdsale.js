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
      baseUnits,
      mintToken } from '../scripts/tokenHelpers.js'

import { buyTokens,
        numberOfTokensFor,
        getWallet,
        getPriceInWei,
        getCap } from '../scripts/tokenSaleHelpers.js'

import {
          pause,
          unpause } from '../scripts/pausableHelpers.js'

import { transferOwnership } from '../scripts/ownershipHelpers.js'

const assert = chai.assert
const should = chai.should()
const expect = chai.expect

const ProofPresaleToken = artifacts.require('./ProofPresaleToken.sol')
const ProofToken = artifacts.require('./ProofToken.sol')
const TokenSale = artifacts.require('./TokenSale.sol')

contract('Crowdsale', (accounts) => {
            console.log(web3.eth.getBalance(accounts[0]) / 10 ** 18)
            let fund = accounts[0]
            let tokenSale
            let tokenSaleAddress
            let proofToken
            let proofPresaleToken
            let proofPresaleTokenAddress
            let proofTokenAddress
            let sender = accounts[1]
            let receiver = accounts[2]
            let hacker1 = accounts[3]
            let hacker2 = accounts[4]
            let wallet = accounts[5]

            let startBlock
            let endBlock

            beforeEach(async function() {
              startBlock = web3.eth.blockNumber + 10
              endBlock = web3.eth.blockNumber + 20

              proofPresaleToken = await ProofPresaleToken.new()
              proofPresaleTokenAddress = await getAddress(proofPresaleToken)

              proofToken = await ProofToken.new(proofPresaleTokenAddress)
              proofTokenAddress = await getAddress(proofToken)

              tokenSale = await TokenSale.new(
                wallet,
                proofPresaleTokenAddress,
                proofTokenAddress,
                startBlock,
                endBlock,
                proofWalletAddress)

              tokenSaleAddress = await getAddress(tokenSale)
            })

            it('should be ended only after end', async function() {
                let ended = await tokenSale.hasEnded()
                ended.should.equal(false)
                await advanceToBlock()
              })

            describe('Initial State', function () {
                beforeEach(async function() {
                  transferOwnership(proofToken, fund, tokenSaleAddress)
                })

                it('should initially set the wallet', async function() {
                  let tokenSaleWallet = await tokenSale.wallet.call()
                  tokenSaleWallet.should.be.equal(wallet)
                })

                it('should initially be linked to the Proof token', async function() {
                  let tokenSaleToken = await tokenSale.proofToken.call()
                  tokenSaleToken.should.be.equal(proofTokenAddress)
                })

                it('should initially be linked to the Proof Presale token', async function() {
                  let tokenSalePresaleToken = await tokenSale.proofPresaleToken.call()
                  tokenSalePresaleToken.should.be.equal(proofPresaleTokenAddress)
                })

                it('Price should be equal to 0.088 ether', async function() {
                  let priceInWei = await tokenSale.priceInWei.call()
                  priceInWei.should.be.bignumber.equal(0.088 * 10 ** 18)
                })
              })

            describe('Initial State after presale', async function() {
                beforeEach(async function() {
                  startBlock = web3.eth.blockNumber + 10
                  endBlock = web3.eth.blockNumber + 20

                  proofPresaleToken = await ProofPresaleToken.new()
                  proofPresaleTokenAddress = await getAddress(proofPresaleToken)

                  await mintToken(proofPresaleToken, fund, sender, 10000)

                  proofToken = await ProofToken.new(proofPresaleTokenAddress)
                  proofTokenAddress = await getAddress(proofToken)

                  tokenSale = await TokenSale.new(
                    wallet,
                    proofPresaleTokenAddress,
                    proofTokenAddress,
                    startBlock,
                    endBlock)

                  tokenSaleAddress = await getAddress(tokenSale)
                })

                it('should have an initial supply equal to the presale token supply', async function() {
                    let initialSupply = await tokenSale.initialSupply.call()
                    initialSupply.should.be.bignumber.equal(10000)
                  })
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

            describe('End and Beginning of Presale', async function() {
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

            describe('Crowdsale', async function() {
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
                    expect(balanceIncrease).almost.equal(1, 3)
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

                  it('should not be allowed if the contract is paused', async function() {
                    await pause(tokenSale, fund)
                    let initialBalance = await getTokenBalance(proofToken, sender)

                    let params = { from: sender, gas: DEFAULT_GAS, gasPrice: DEFAULT_GAS_PRICE }
                    await expectInvalidOpcode(tokenSale.buyTokens(1, params))

                    let balance = await getTokenBalance(proofToken, sender)
                    balance.should.be.equal(initialBalance)
                  })

                  it('should be allowed if the contract is paused and unpaused', async function() {
                    let initialBalance = await getTokenBalance(proofToken, sender)

                    await buyTokens(tokenSale, sender, 1 * ether)
                    await pause(tokenSale, fund)
                    await unpause(tokenSale, fund)
                    await buyTokens(tokenSale, sender, 1 * ether)

                    let balance = await getTokenBalance(proofToken, sender)
                    let balanceIncrease = await baseUnits(proofToken, balance - initialBalance)
                    expect(balanceIncrease).to.almost.equal(22.7272727272)
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



