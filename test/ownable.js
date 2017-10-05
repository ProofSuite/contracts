const BigNumber = web3.BigNumber
let chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var chaiStats = require('chai-stats')
var chaiBigNumber = require('chai-bignumber')(BigNumber)
chai.use(chaiAsPromised).use(chaiBigNumber).use(chaiStats).should()

import { getAddress,
         expectInvalidOpcode } from '../scripts/helpers.js'

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
  let proofToken
  let proofPresaleToken
  let proofPresaleTokenAddress
  let proofTokenAddress
  let receiver = accounts[2]
  let hacker1 = accounts[3]
  let hacker2 = accounts[4]
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

    proofToken = await ProofToken.new(
      '0x0',
      '0x0',
      0,
      'Proof Token',
      18,
      'PRFT',
      true)

    tokenSale = await TokenSale.new(
      wallet,
      proofTokenAddress,
      startBlock,
      endBlock)
  })

  describe('Ownership', function () {
    it('should initially belong to contract caller', async function() {
      let controller = await tokenSale.controller.call()
      assert.equal(controller, fund)
    })

    it('should be transferable to another account', async function() {
      let controller = await tokenSale.controller.call()
      await transferControl(tokenSale, controller, receiver)
      let newOwner = await tokenSale.controller.call()
      assert.equal(newOwner, receiver)
    })

    it('should not be transferable by non-controller', async function() {
      let controller = await tokenSale.controller.call()
      await expectInvalidOpcode(transferControl(tokenSale, hacker1, hacker2))
      const newOwner = await tokenSale.controller.call()
      assert.equal(controller, newOwner)
    })
  })
})
