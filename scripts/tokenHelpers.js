const h = require('../scripts/helpers.js')
import { DEFAULT_GAS, DEFAULT_GAS_PRICE } from '../scripts/testConfig.js'

/**
 * @description
 * @param token
 * @returns
 */
const getOwner = async (token) => {
  let owner = await token.owner.call()
  return owner
}

/**
 * @description
 * @param token
 * @returns
 */
const getTotalSupply = async (token) => {
  let tokenSupply = await token.totalSupply.call()
  return tokenSupply.toNumber()
}

/**
 * @description
 * @param token
 * @param owner
 * @returns
 */
const getTokenBalance = async (token, owner) => {
  let balance = await token.balanceOf.call(owner)
  return balance.toNumber()
}

/**
 * @description
 * @param contract
 * @param sender
 * @param receiver
 * @param amount
 * @returns
 */
const transferToken = async(contract, sender, receiver, amount) => {
  let params = { from: sender, gas: DEFAULT_GAS, gasPrice: DEFAULT_GAS_PRICE }
  let txn = await contract.transfer(receiver, amount, params)
  let txnReceipt = await h.waitUntilTransactionsMined(txn.tx)
  return txnReceipt
}

/**
 * @description
 * @param token
 * @param sender
 * @param receiver
 * @param amount
 * @returns
 */
const transferTokens = async(token, sender, receiver, amount) => {
  let promises = token.map(function (oneToken) { transferToken(oneToken, sender, receiver, amount) })
  let txnReceipts = await Promise.all(promises)
  return txnReceipts
}

/**
 * @description
 * @param contract
 * @param minter
 * @param receiver
 * @param amount
 * @returns
 */
const mintToken = async(contract, minter, receiver, amount) => {
  let params = { from: minter, gas: DEFAULT_GAS, gasPrice: DEFAULT_GAS_PRICE }
  let txn = await contract.mint(receiver, amount, params)
  let txnReceipt = await h.waitUntilTransactionsMined(txn.tx)
  return txnReceipt
}

/**
 * @description
 * @param contract
 * @param sender
 * @returns
 */
const finishMinting = async(contract, sender) => {
  let params = { from: sender, gas: DEFAULT_GAS, gasPrice: DEFAULT_GAS_PRICE }
  let txn = await contract.finishMinting(params)
  let txnReceipt = await h.waitUntilTransactionsMined(txn.tx)
  return txnReceipt
}

/**
 * @description
 * @param token
 * @param amount
 * @returns
 */
const baseUnits = async(token, amount) => {
  let decimals = await token.decimals.call()
  return (amount / (10 ** decimals.toNumber()))
}

/**
 * @description
 * @param token
 * @param amount
 * @returns
 */
const ERC20Units = async(token, amount) => {
  let decimals = await token.decimals.call()
  return (amount * (10 ** decimals.toNumber()))
}

/**
 * @description
 * @param token
 * @param sender
 * @returns
 */
const claimTokens = async(token, sender) => {
  let params = { from: sender, gas: DEFAULT_GAS, gasPrice: DEFAULT_GAS_PRICE }
  let txn = await token.claim(params)
  let txnReceipt = await h.waitUntilTransactionsMined(txn.tx)
  return txnReceipt
}

module.exports = {
  getOwner,
  getTotalSupply,
  getTokenBalance,
  transferToken,
  transferTokens,
  mintToken,
  finishMinting,
  baseUnits,
  ERC20Units,
  claimTokens
}
