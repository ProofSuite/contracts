const BigNumber = web3.BigNumber
let chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var chaiStats = require('chai-stats')
var chaiBigNumber = require('chai-bignumber')(BigNumber)
chai.use(chaiAsPromised).use(chaiBigNumber).use(chaiStats).should()

import { TOKENS_ALLOCATED_TO_PROOF } from '../scripts/testConfig.js'
import { getAddress } from '../scripts/helpers.js'
import { baseUnits, mintToken } from '../scripts/tokenHelpers.js'
import { transferOwnership } from '../scripts/ownershipHelpers.js'
import { transferControl } from '../scripts/controlHelpers.js'

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
      endBlock)

    tokenSaleAddress = await getAddress(tokenSale)
  })

  // it('should be ended only after end', async function() {
  //   let ended = await tokenSale.hasEnded()
  //   ended.should.equal(false)
  // })

  describe('Initial State', function () {

    beforeEach(async function() {
      transferControl(proofToken, fund, tokenSaleAddress)
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
