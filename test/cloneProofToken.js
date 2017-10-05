require('../scripts/jsHelpers.js')

const fs = require('fs')
const csv = require('csv-parser')
const json2csv = require('json2csv')

const BigNumber = web3.BigNumber
let chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var chaiStats = require('chai-stats')
var chaiBigNumber = require('chai-bignumber')(BigNumber)
chai.use(chaiAsPromised).use(chaiBigNumber).use(chaiStats).should()

import {
  DEFAULT_GAS,
  DEFAULT_GAS_PRICE,
  TOKENS_ALLOCATED_TO_PROOF
} from '../scripts/testConfig.js'

import {
  getAddress,
  expectInvalidOpcode
} from '../scripts/helpers.js'

import {
  transferOwnership
} from '../scripts/ownershipHelpers.js'

import {
  transferControl
} from '../scripts/controlHelpers.js'

import {
  getTokenBalance,
  getTokenBalanceAt,
  getTotalSupply,
  getTotalSupplyAt,
  mintToken,
  getOwner,
  getController,
  transferToken,
  importBalances,
  lockBalances,
  claimTokens,
  cloneToken
} from '../scripts/tokenHelpers.js'

const assert = chai.assert
const should = chai.should()
const expect = chai.expect

const ProofPresaleToken = artifacts.require('./ProofPresaleToken.sol')
const ProofToken = artifacts.require('./ProofToken.sol')
const TokenSale = artifacts.require('./TokenSale.sol')

contract('proofToken', (accounts) => {
  let tokenSale
  let tokenSaleAddress
  let proofToken
  let proofPresaleToken
  let proofPresaleTokenAddress
  let proofTokenAddress

  let fund = accounts[0]
  let sender = accounts[1]
  let receiver = accounts[2]
  let hacker = accounts[3]
  let wallet = accounts[4]
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
  })

  describe('Clone token', function () {
    it('should be able to clone token', async function () {
      let controller = await getController(proofToken)

      let config = {
        name:'Proof Token',
        decimals: 18,
        symbol: 'PRFT2',
        block: 0,
        transfersEnabled: true
      }

      await cloneToken(proofToken, fund, config)
      controller.should.be.equal(fund)
    })

    it('should not be cloneable by non-controller contract', async function() {
      let config = {
        name: 'Proof Token v.2',
        decimals: 18,
        symbol: 'PRFT2',
        block: 0,
        transfersEnabled: true
      }

      await expectInvalidOpcode(cloneToken(proofToken, hacker, config))
    })
  })
})
