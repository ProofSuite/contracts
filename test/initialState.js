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
import { getPrice } from '../scripts/tokenSaleHelpers.js'

const assert = chai.assert
const should = chai.should()
const expect = chai.expect

const ProofPresaleToken = artifacts.require('./ProofPresaleToken.sol')
const ProofToken = artifacts.require('./ProofToken.sol')
const TokenSale = artifacts.require('./TokenSale.sol')

debugger;

contract('Crowdsale', (accounts) => {
  let fund = accounts[0]
  let tokenSale
  let tokenSaleAddress
  let proofToken
  let proofPresaleToken
  let proofPresaleTokenAddress
  let proofTokenAddress
  let sender = accounts[1]
  let proofWalletAddress = accounts[9]

  let startBlock
  let endBlock

  let PROOF_MULTISIG = 0x0
  let PROOF_TOKEN_WALLET = 0x0

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
      let wallet = await tokenSale.PROOF_TOKEN_WALLET.call()
      wallet.should.be.equal(wallet)
    })

    it('should initially set the multisig', async function() {
      let multisig = await tokenSale.PROOF_MULTISIG.call()
      multisig.should.be.equal(PROOF_MULTISIG)
    })

    it('should initially be linked to the Proof token', async function() {
      let token = await tokenSale.proofToken.call()
      token.should.be.equal(proofTokenAddress)
    })

    it('Token base price should be equal to 0.0748 ether', async function() {
      let price = await getPrice(tokenSale)
      expect(price).almost.equal(0.85 * 0.088)
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
        proofTokenAddress,
        startBlock,
        endBlock)

      tokenSaleAddress = await getAddress(tokenSale)
    })
  })
})
