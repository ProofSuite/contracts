/**
 * Ownership helpers module
 * @module ownership-helpers
 */

var Promise = require('bluebird')
import { gas } from './testConfig.js'
import { waitUntilTransactionsMined } from './helpers.js'

/**
 * @description Transfer ownership of input contract and wait until corresponding transaction is mined
 * @param contract {Object} - Truffle Contract Object
 * @param sender {String}
 * @param receiver {String}
 * @returns transaction receipt {Object}
 */
const transferOwnership = async (contract, sender, receiver) => {
  let params = { from: sender, gas: gas }
  let txn = await contract.transferOwnership(receiver, params)
  let txnReceipt = await waitUntilTransactionsMined(txn.tx)
  return txnReceipt
}

/**
 * @description Transfer the ownerships of input contracts and wait until corresponding transactions are mined
 * @param contracts {Object} - Truffle Object Contract Array
 * @param sender {String}
 * @param receiver {String}
 */
const transferOwnerships = async (contracts, sender, receiver) => {
  let promises = contracts.map(function (contract) { transferOwnership(contract, sender, receiver) })
  await Promise.all(promises)
}

/**
 * @description Lock ownership of input contract and wait until corresponding transaction is mined
 * @param contract {Object} - Truffle Object Contract Array
 * @param owner - {String}
 * @returns Transaction Receipt {Object}
 */
const lockOwnership = async (contract, owner) => {
  let params = { from: owner, gas: gas }
  let txn = await contract.lockOwnership(owner, params)
  let txnReceipt = await waitUntilTransactionsMined(txn.tx)
  return txnReceipt
}

module.exports = {
  transferOwnership,
  transferOwnerships,
  lockOwnership
}
