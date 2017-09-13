const h = require('../scripts/helpers.js')
import { DEFAULT_GAS, DEFAULT_GAS_PRICE } from '../scripts/testConfig.js'

/**
 * @description Get owner of token contract
 * @param token
 * @returns owner
 */
const getOwner = async (token) => {
  let owner = await token.owner.call()
  return owner
}

/**
 * @description Get total supply of token contract
 * @param token
 * @returns total supply
 */
const getTotalSupply = async (token) => {
  let tokenSupply = await token.totalSupply.call()
  return tokenSupply.toNumber()
}

/**
 * @description Get token balance of owner
 * @param token
 * @param owner
 * @returns token balance
 */
const getTokenBalance = async (token, owner) => {
  let balance = await token.balanceOf.call(owner)
  return balance.toNumber()
}

/**
 * @description Transfer amount of token from sender to receiver
 * @param token
 * @param sender
 * @param receiver
 * @param amount
 * @returns transaction receipt
 */
const transferToken = async(token, sender, receiver, amount) => {
  let params = { from: sender, gas: DEFAULT_GAS, gasPrice: DEFAULT_GAS_PRICE }
  let txn = await token.transfer(receiver, amount, params)
  let txnReceipt = await h.waitUntilTransactionsMined(txn.tx)
  return txnReceipt
}

/**
 * @description Transfer amount of each token in the tokens array from sender to receiver
 * @param token
 * @param sender
 * @param receiver
 * @param amount
 * @returns transaction receipts
 */
const transferTokens = async(tokens, sender, receiver, amount) => {
  let promises = tokens.map(function (oneToken) { transferToken(oneToken, sender, receiver, amount) })
  let txnReceipts = await Promise.all(promises)
  return txnReceipts
}

/**
 * @description Mint amount of token for the receiver. Only works if minter is the owner of the token
 * @param contract
 * @param minter
 * @param receiver
 * @param amount
 * @returns transaction receipt
 */
const mintToken = async(contract, minter, receiver, amount) => {
  let params = { from: minter, gas: DEFAULT_GAS, gasPrice: DEFAULT_GAS_PRICE }
  let txn = await contract.mint(receiver, amount, params)
  let txnReceipt = await h.waitUntilTransactionsMined(txn.tx)
  return txnReceipt
}

/**
 * @description Finish minting period for the token contract. Only works if sender is the owner of the token
 * @param token
 * @param sender
 * @returns transaction receipt
 */
const finishMinting = async(token, sender) => {
  let params = { from: sender, gas: DEFAULT_GAS, gasPrice: DEFAULT_GAS_PRICE }
  let txn = await token.finishMinting(params)
  let txnReceipt = await h.waitUntilTransactionsMined(txn.tx)
  return txnReceipt
}

/**
 * @description Convert ERC20 units (=number of base units times 10^decimals) to base units
 * @param token
 * @param amount
 * @returns base units
 */
const baseUnits = async(token, amount) => {
  let decimals = await token.decimals.call()
  return (amount / (10 ** decimals.toNumber()))
}

/**
 * @description Convert base units (=number of ERC20 units divided by 10^decimals) to ERC20 units
 * @param token
 * @param amount
 * @returns ERC20 units
 */
const ERC20Units = async(token, amount) => {
  let decimals = await token.decimals.call()
  return (amount * (10 ** decimals.toNumber()))
}

/**
 * @description Allocates (presale) tokens to the sender
 * @param token
 * @param sender
 * @returns transaction receipt
 */
const claimTokens = async(token, sender) => {
  let params = { from: sender, gas: DEFAULT_GAS, gasPrice: DEFAULT_GAS_PRICE }
  let txn = await token.claim(params)
  let txnReceipt = await h.waitUntilTransactionsMined(txn.tx)
  return txnReceipt
}

/**
 * @description Import presale tokens to the token sale contract
 * @param token
 * @param addresses
 * @param balances
 * @returns transaction receipt
 */
const importBalances = async(token, addresses, balances) => {
  let txn = await token.importPresaleBalances(addresses, balances)
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
  claimTokens,
  importBalances
}
