const BigNumber = web3.BigNumber
let chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var chaiStats = require('chai-stats')
var chaiBigNumber = require('chai-bignumber')(BigNumber)
chai.use(chaiAsPromised).use(chaiBigNumber).use(chaiStats).should()

import { TOKENS_ALLOCATED_TO_PROOF } from '../scripts/testConfig.js'
import { getAddress, latestTime } from '../scripts/helpers.js'
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

  let startTime
  let endTime
  let contractUploadTime

  let proofMultiSig = '0x99892ac6da1b3851167cb959fe945926bca89f09'

  beforeEach(async function() {

    proofPresaleToken = await ProofPresaleToken.new()
    proofPresaleTokenAddress = await getAddress(proofPresaleToken)

    proofToken = await ProofToken.new(
      '0x0',
      '0x0',
      0,
      'Proof Token Test',
      'PRFT Test'
    )

    proofTokenAddress = await getAddress(proofToken)

    contractUploadTime = latestTime()
    startTime = contractUploadTime.add(1, 'day').unix()
    endTime = contractUploadTime.add(31, 'day').unix()


    tokenSale = await TokenSale.new(
      proofTokenAddress,
      startTime,
      endTime)

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

    it('should initially set the multisig', async function() {
      let multisig = await tokenSale.proofMultiSig.call()
      multisig.should.be.equal(proofMultiSig)
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
})
