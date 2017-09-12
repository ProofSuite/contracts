/**
 * Pausable helpers module
 * @module pausable-helpers
 */

import { waitUntilTransactionsMined } from './helpers.js'

/**
 * @description Pause the contract and wait until the transaction is mined
 * @param contract Token truffle contract
 * @param owner Ethereum Address
 */
const pause = async(contract, owner) => {
  let tx = await contract.pause({ from: owner, gas: 1000000 })
  await waitUntilTransactionsMined(tx.tx)
}

/**
 * @description Unpause contract and wait until the transaction is mined
 * @param contract Token Truffle Contract
 * @param owner Ethereum Address
 */
const unpause = async(contract, owner) => {
  let tx = await contract.unpause({ from :owner, gas: 1000000 })
  await waitUntilTransactionsMined(tx.tx)
}

module.exports = {
  pause,
  unpause
}
