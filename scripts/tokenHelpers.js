const h = require('../scripts/helpers.js')
const config = require('../config.js')
import { getAddress } from './helpers.js'

let { DEFAULT_GAS, DEFAULT_GAS_PRICE, MAX_GAS } = config.constants;

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
 * @description Get owner of token contract
 * @param token
 * @returns owner
 */
const getController = async (token) => {
  let controller = await token.controller.call()
  return controller
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
 * @description Get total supply of token contract
 * @param token
 * @returns total supply
 */
const getTotalSupplyAt = async (token, blockNumber) => {
  let tokenSupply = await token.totalSupplyAt.call(blockNumber)
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
 * @description Get token balance of owner
 * @param token
 * @param owner
 * @returns token balance
 */
const getTokenBalanceAt = async (token, owner, blockNumber) => {
  let balance = await token.balanceOfAt.call(owner, blockNumber)
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
 * @description Transfer amount of token from sender to receiver
 * @param token
 * @param caller
 * @param receiver
 * @param amount
 * @returns transaction receipt
 */
const transferTokenFrom = async(token, caller, sender, receiver, amount) => {
  let params = { from: caller, gas: DEFAULT_GAS, gasPrice: DEFAULT_GAS_PRICE }
  let txn = await token.transferFrom(sender, receiver, amount, params)
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
 * @description Burn amount of tokens from the owner
 * @param contract
 * @param minter
 * @param receiver
 * @param amount
 * @returns transaction receipt
 */
const burnTokens = async(contract, caller, owner, amount) => {
  let params = { from: caller, gas: DEFAULT_GAS, gasPrice: DEFAULT_GAS_PRICE }
  let txn = await contract.burn(owner, amount, params)
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
  let txn = await token.claimTokens(params)
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
const importBalances = async(token, caller, addresses, balances) => {
  let txn = await token.importPresaleBalances(addresses, balances, { from: caller, gas: MAX_GAS, gasPrice: DEFAULT_GAS_PRICE })
  let txnReceipt = await h.waitUntilTransactionsMined(txn.tx)
  return txnReceipt
}

const lockBalances = async(token, caller) => {
  let txn = await token.lockPresaleBalances({ from: caller })
  let txnReceipt = await h.waitUntilTransactionsMined(txn.tx)
  return txnReceipt
}

const cloneToken = async(contract, caller, config) => {
  let txn = await contract.createCloneToken(
    config.block,
    config.name,
    config.symbol,
    { from: caller })

  let txnReceipt = await h.waitUntilTransactionsMined(txn.tx)
  return txnReceipt
}

const approve = async(token, caller, spender, amount) => {
  let txn = await token.approve(spender, amount, {from: caller })
  let txnReceipt = await h.waitUntilTransactionsMined(txn.tx)
  return txnReceipt
}

const getAllowance = async(token, owner, spender) => {
  let allowance = await token.allowance.call(owner, spender)
  return allowance.toNumber()
}

const enableTransfers = async(token, caller) => {
  let txn = await token.enableTransfers(true, { from: caller })
  let txnReceipt = await waitUntilTransactionsMined(txn.tx)
}

const lockTransfers = async(token, caller) => {
  let txn = await token.enableTransfers(false, { from: caller })
  let txnReceipt = await waitUntilTransactionsMined(txn.tx)
}

module.exports = {
  getOwner,
  getController,
  getTotalSupply,
  getTotalSupplyAt,
  getTokenBalance,
  getTokenBalanceAt,
  transferToken,
  transferTokenFrom,
  transferTokens,
  mintToken,
  burnTokens,
  finishMinting,
  baseUnits,
  ERC20Units,
  claimTokens,
  importBalances,
  lockBalances,
  cloneToken,
  approve,
  getAllowance
}
