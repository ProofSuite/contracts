import { waitUntilTransactionsMined } from '../scripts/helpers.js'

/**
 * @description
 * @param contract
 * @param owner
 */
const pause = async(contract, owner) => {
  let tx = await contract.pause({ from: owner, gas: 1000000 })
  await waitUntilTransactionsMined(tx.tx)
}

/**
 * @description
 * @param contract
 * @param owner
 */
const unpause = async(contract, owner) => {
  let tx = await contract.unpause({ from :owner, gas: 1000000 })
  await waitUntilTransactionsMined(tx.tx)
}

module.exports = {
  pause,
  unpause
}
