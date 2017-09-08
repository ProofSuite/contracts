import { DEFAULT_GAS, DEFAULT_GAS_PRICE, ether, pointsMultiplier } from '../scripts/testConfig.js'
import { waitUntilTransactionsMined } from '../scripts/helpers.js'

/**
 * @description
 * @param tokenSale
 * @returns
 */
const getWallet = async (tokenSale) => {
  let wallet = await tokenSale.wallet.call()
  return wallet
}

/**
 * @description
 * @param tokenSale
 * @returns
 */
const getToken = async (tokenSale) => {
  let token = await tokenSale.proofToken.call()
  return token
}

/**
 * @description
 * @param tokenSale
 * @returns
 */
const getPresaleToken = async (tokenSale) => {
  let token = await tokenSale.proofPresaleToken.call()
  return token
}

/**
 * @description
 * @param tokenSale
 * @returns
 */
const getCap = async (tokenSale) => {
  let cap = await tokenSale.cap.call()
  return cap.toNumber()
}

/**
 * @description
 * @param tokenSale
 * @returns
 */
const getPriceInWei = async (tokenSale) => {
  let priceInWei = await tokenSale.priceInWei.call()
  return priceInWei.toNumber()
}

/**
 * @description
 * @param tokenSale
 * @param sender
 * @param value
 * @returns
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
 * @description
 * @param tokenSale
 * @returns
 */
const tokenPriceInWei = async (tokenSale) => {
  let price = await tokenSale.priceInWei.call()
  return price.toNumber()
}

/**
 * @description
 * @param tokenSale
 * @returns
 */
const tokenPrice = async (tokenSale) => {
  let price = await tokenSale.priceInWei.call()
  return (price.toNumber() / ether)
}

/**
 * @description
 * @param tokenSale
 * @param weiAmount
 * @returns
 */
const numberOfTokensFor = async (tokenSale, weiAmount) => {
  let priceInWei = await tokenPriceInWei(tokenSale)
  let numberOfTokens = Math.floor(weiAmount * pointsMultiplier / priceInWei)
  return numberOfTokens
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
  getPriceInWei,
  getCap
}
