/**
 * Token Sale Helpers Module
 * @module token-sale-helpers
 */

import { DEFAULT_GAS, DEFAULT_GAS_PRICE, ether, pointsMultiplier } from './testConfig.js'
import { waitUntilTransactionsMined } from './helpers.js'

/**
 * @description Returns wallet address for input token sale contract
 * @alias module:token-sale-helpers
 * @param tokenSale {Object} - Truffle Contract Object
 * @returns wallet {String}
 */
const getWallet = async (tokenSale) => {
  let wallet = await tokenSale.wallet.call()
  return wallet
}

const getMultisig = async (tokenSale) => {
  let multisig = await tokenSale.PROOF_MULTISIG.call()
  return multisig
}

const getContributors = async (tokenSale) => {
  let contributors = await tokenSale.contributors.call()
  return contributors.toNumber()
}

/**
 * @description Returns token address for input token sale contract
 * @alias module:token-sale-helpers
 * @param tokenSale  {Object} - Truffle Contract Object
 * @returns token {String}
 */
const getToken = async (tokenSale) => {
  let token = await tokenSale.proofToken.call()
  return token
}

/**
 * @description Returns presale token for input token sale contract
 * @alias module:token-sale-helpers
 * @param tokenSale {Object} - Truffle Contract Object
 * @returns token {String}
 */
const getPresaleToken = async (tokenSale) => {
  let presaleToken = await tokenSale.proofPresaleToken.call()
  return presaleToken
}

/**
 * @description Returns cap for input token sale contract
 * @alias module:token-sale-helpers
 * @param tokenSale {Object} - Truffle Contract Object
 * @returns token sale cap {String}
 */
const getCap = async (tokenSale) => {
  let cap = await tokenSale.cap.call()
  return cap.toNumber()
}

/**
 * @description Returns the price in wei of one token sold by the input token sale contract
 * @alias module:token-sale-helpers
 * @param tokenSale {Object} - Truffle Contract Object
 * @returns token price in wei {String}
 */
const getBasePriceInWei = async (tokenSale) => {
  let priceInWei = await tokenSale.BASE_PRICE_IN_WEI.call()
  return priceInWei.toNumber()
}

/**
 * @description Returns the base token price (price of the token without current premium)
 * @alias module:token-sale-helpers
 * @param tokenSale {Object} - Truffle Contract Object
 * @returns base token price in wei {Number}
 */
const getBasePrice = async (tokenSale) => {
  let price = await getBasePriceInWei(tokenSale)
  return (price / 10 ** 18)
}

/**
 * @description Returns token price in wei
 * @alias module:token-sale-helpers
 * @param tokenSale {Object} - Truffle Contract Object
 * @returns token price in wei {Number}
 */
const getPriceInWei = async (tokenSale) => {
  let priceInWei = await tokenSale.getPriceInWei.call()
  return priceInWei.toNumber()
}

/**
 * @description Returns token price in ether
 * @alias module:token-sale-helpers
 * @param tokenSale  {Object} - Truffle Contract Object
 * @returns token price in ether {Number}
 */
const getPrice = async (tokenSale) => {
  let price = await getPriceInWei(tokenSale)
  return (price / 10 ** 18)
}

/**
 * @description Returns the number of remaining tokens
 * @alias module:token-sale-helpers
 * @param tokenSale {Object} - Truffle Contract Object
 * @returns remaining tokens
 */
const getRemainingTokens = async (tokenSale) => {
  let remainingTokens = await tokenSale.remainingTokens.call()
  return remainingTokens.toNumber()
}

/**
 * @description Performs an token order from sender to the input token sale contract
 * @alias module:token-sale-helpers
 * @param tokenSale {Object} - Truffle Contract Object corresponding to token sale contract
 * @param sender {String} - Ethereum address from which ether is being sent
 * @param value {Number} - Value to be send to the contract
 * @returns txnReceipt {Object} - Transaction receipt
 */
const buyTokens = async (tokenSale, sender, value) => {
  let order = {
    from: sender,
    value: value,
    gas: DEFAULT_GAS,
    gasPrice: DEFAULT_GAS_PRICE
  }

  let txn = await tokenSale.buyTokens(sender, order)
  let txnReceipt = await waitUntilTransactionsMined(txn.tx)
  return txnReceipt
}

/**
 * @description Returns the token price in wei
 * @alias module:token-sale-helpers
 * @param tokenSale {Object} - Truffle Contract Object
 * @returns token price in wei {Number}
 */
const tokenPriceInWei = async (tokenSale) => {
  let price = await tokenSale.getPriceInWei.call()
  return price.toNumber()
}

/**
 * @description Returns the token price
 * @alias module:token-sale-helpers
 * @param tokenSale {Object} - Truffle Contract Object
 * @returns token price in ether {Number}
 */
const tokenPrice = async (tokenSale) => {
  let price = await getPriceInWei(tokenSale)
  return (price.toNumber() / ether)
}

/**
 * @description Returns number of tokens for a certain amount of ether sent to a token sale contract
 * @alias module:token-sale-helpers
 * @param tokenSale {Object} - Truffle Contract Object
 * @param weiAmount {Number}
 * @returns number of tokens {Number}
 */
const numberOfTokensFor = async (tokenSale, weiAmount) => {
  let priceInWei = await tokenPriceInWei(tokenSale)
  let numberOfTokens = Math.floor(weiAmount * pointsMultiplier / priceInWei)
  return numberOfTokens
}

const finalize = async (tokenSale, caller) => {
  let txn = await tokenSale.finalize({ from: caller })
  let txnReceipt = await waitUntilTransactionsMined(txn.tx)
  return txnReceipt
}

const enableTransfers = async (tokenSale, caller) => {
  let txn = await tokenSale.enableTransfers({ from: caller })
  let txnReceipt = await waitUntilTransactionsMined(txn.tx)
  return txnReceipt
}

const lockTransfers = async (tokenSale, caller) => {
  let txn = await tokenSale.lockTransfers({ from: caller })
  let txnReceipt = await waitUntilTransactionsMined(txn.tx)
  return txnReceipt
}

const enableMasterTransfers = async (tokenSale, caller) => {
  let txn = await tokenSale.enableMasterTransfers({ from: caller })
  let txnReceipt = await waitUntilTransactionsMined(txn.tx)
  return txnReceipt
}

const lockMasterTransfers = async (tokenSale, caller) => {
  let txn = await tokenSale.lockMasterTransfers({from: caller })
  let txnReceipt = await waitUntilTransactionsMined(txn.tx)
  return txnReceipt
}

module.exports = {
  getWallet,
  getToken,
  getPresaleToken,
  buyTokens,
  tokenPrice,
  tokenPriceInWei,
  pointsMultiplier,
  numberOfTokensFor,
  getBasePrice,
  getBasePriceInWei,
  getPrice,
  getPriceInWei,
  getCap,
  getMultisig,
  getContributors,
  finalize,
  enableTransfers,
  lockTransfers,
  enableMasterTransfers,
  lockMasterTransfers
}
