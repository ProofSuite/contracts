import { waitUntilTransactionsMined } from '../scripts/helpers.js'

const pause = async(contract, sender) => {
  let tx = await contract.pause({ from: sender, gas: 1000000 })
  await waitUntilTransactionsMined(tx.tx)
}

const unpause = async(contract, sender) => {
  let tx = await contract.unpause({ from :sender, gas: 1000000 })
  await waitUntilTransactionsMined(tx.tx)
}

module.exports = {
  pause,
  unpause
}
