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
 * @param controller {String}
 * @param newController {String}
 * @returns transaction receipt {Object}
 */
const transferControl = async (contract, controller, newController) => {
  let params = { from: controller, gas: gas }
  let txn = await contract.transferControl(newController, params)
  let txnReceipt = await waitUntilTransactionsMined(txn.tx)
  return txnReceipt
}

/**
 * @description Transfer the ownerships of input contracts and wait until corresponding transactions are mined
 * @param contracts {Object} - Truffle Object Contract Array
 * @param controller {String}
 * @param newController {String}
 */
const transferControls = async (contracts, controller, newController) => {
  let promises = contracts.map(function (contract) { transferControl(contract, controller, newController) })
  await Promise.all(promises)
}

/**
 * @description Lock ownership of input contract and wait until corresponding transaction is mined
 * @param contract {Object} - Truffle Object Contract Array
 * @param controller - {String}
 * @returns Transaction Receipt {Object}
 */
const lockControl = async (contract, controller) => {
  let params = { from: controller, gas: gas }
  let txn = await contract.lockControl(controller, params)
  let txnReceipt = await waitUntilTransactionsMined(txn.tx)
  return txnReceipt
}

module.exports = {
  transferControl,
  transferControls,
  lockControl
}
