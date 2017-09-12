const BigNumber = web3.BigNumber
let chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var chaiStats = require('chai-stats')
var chaiBigNumber = require('chai-bignumber')(BigNumber)
chai.use(chaiAsPromised).use(chaiBigNumber).use(chaiStats).should()

import { TOKENS_ALLOCATED_TO_PROOF, ether } from '../scripts/testConfig.js'
import { getAddress } from '../scripts/helpers.js'
import { baseUnits, mintToken, getTokenBalance } from '../scripts/tokenHelpers.js'
import { transferOwnership } from '../scripts/ownershipHelpers.js'
import { mintToken, buyTokens } from '../scripts/tokenSaleHelpers.js'

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

  // it('should be ended only after end', async function() {
  //   let ended = await tokenSale.hasEnded()
  //   ended.should.equal(false)
  // })

  describe('Token Information', function() {

    beforeEach(async function() {
      transferOwnership(proofToken, fund, tokenSaleAddress)
    })

    it('should return the correct token supply', async function() {

      await mintToken(tokenSale, fund, receiver, 1 * ether)

      let supply = await proofToken.totalSupply.call()
      let tokenSaleDisplaySupply = await tokenSale.totalSupply.call()

      supply.should.be.equal(tokenSaleDisplaySupply)
    })

    //the token balance of each token holder can also be displayed via the token sale contract - by routing towards the proof token balanceOf() method
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

      proofToken = await ProofToken.new(proofPresaleTokenAddress, proofWalletAddress)
      proofTokenAddress = await getAddress(proofToken)

      tokenSale = await TokenSale.new(
        wallet,
        proofTokenAddress,
        startBlock,
        endBlock)

      tokenSaleAddress = await getAddress(tokenSale)
    })

    it('should have an initial supply equal to the presale token supply', async function() {
      let supply = await tokenSale.totalSupply.call()
      supply = await baseUnits(proofToken, supply.toNumber())
      let expectedSupply = await baseUnits(proofToken, 10000 + TOKENS_ALLOCATED_TO_PROOF)

      supply.should.be.bignumber.equal(expectedSupply)
    })
  })
})
