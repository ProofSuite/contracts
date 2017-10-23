import moment from 'moment'

/**
 * @module Helpers
 */

var Promise = require('bluebird')
let chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
const expect = chai.expect
chai.should()
chai.use(chaiAsPromised)

/**
 * @description Returns a promise that is resolve when transactions corresponding to input hashes are resolved
 * @param txnHashes {String[]}
 * @returns Promise resolved upon mining of all input transaction {Promise}
 */
const waitUntilTransactionsMined = (txnHashes) => {
  var transactionReceiptAsync
  const interval = 500
  transactionReceiptAsync = function (txnHashes, resolve, reject) {
    try {
      var receipt = web3.eth.getTransactionReceipt(txnHashes)
      if (receipt == null) {
        setTimeout(function () {
          transactionReceiptAsync(txnHashes, resolve, reject)
        }, interval)
      } else {
        resolve(receipt)
      }
    } catch (e) {
      reject(e)
    }
  }

  if (Array.isArray(txnHashes)) {
    var promises = []
    txnHashes.forEach(function (txnHash) {
      promises.push(waitUntilTransactionsMined(txnHash))
    })
    return Promise.all(promises)
  } else {
    return new Promise(function (resolve, reject) { transactionReceiptAsync(txnHashes, resolve, reject) })
  }
}

/**
 * @description Returns the balance of an ethereum wallet
 * @param address {String} - Ethereum address
 * @returns wallet balance {Number}
 */
const getBalance = (address) => {
  let balance = web3.eth.getBalance(address)
  return balance.toNumber()
}

/**
 * @description Returns the balance of several ethereum wallets (in wei)
 * @param addresses {String[]} - Array of ethereum addresses
 * @returns wallet balances (in wei) {Number[]}
 */
const getBalances = (addresses) => {
  let balances = []
  addresses.map(function (address) { balances.push(getBalance(address)) })
  return balances
}

/**
 * @description Returns the balance of an ethereum wallet (in ether)
 * @param address {String} - Ethereum address
 * @returns wallet balance (in ether) {Number}
 */
const getEtherBalance = (address) => {
  let balance = web3.fromWei(web3.eth.getBalance(address), 'ether')
  return balance.toNumber()
}

/**
 * @description Returns the balance of several ethereum wallets (in ether)
 * @param addresses {String[]}
 * @returns wallet balances (in ether) {Number[]}
 */
const getEtherBalances = (addresses) => {
  let balances = []
  addresses.forEach(function (address) { balances.push(getEtherBalance(address)) })
  return balances
}

/**
 * @description Converts wei to ether
 * @param valueInWei {Number}
 * @returns valueInEther {Number}
 */
const inEther = (valueInWei) => {
  let amount = web3.fromWei(valueInWei, 'ether')
  return Number(amount)
}

/**
 * @description Converts ether to wei
 * @param valueInEther {Number}
 * @returns valueInWei {Number}
 */
const inWei = (valueInEther) => {
  let amount = web3.toWei(valueInEther, 'ether')
  return amount.toNumber()
}

// in our case the base units are cents
/**
 * @description Convert tokens cents to token units
 * @param tokenCents {Number}
 * @returns token base units {Number}
 */
const inBaseUnits = (tokenCents) => {
  return tokenCents / (10 ** 2)
}

/**
 * @description Converts token units to token cents
 * @param tokenBaseUnits {Number}
 * @returns token cents {Number}
 */
const inCents = (tokenBaseUnits) => {
  return tokenBaseUnits * (10 ** 2)
}

/**
 * @description Converts token base units (ERC20 units) to token units
 * @param tokenBaseUnits {Number}
 * @returns token units {Number}
 */
const inTokenUnits = (tokenBaseUnits) => {
  return tokenBaseUnits / (10 ** 18)
}

/**
 * @description Returns address corresponding to a contract
 * @param contract {Object} - Truffle Contract Object
 * @returns address {String}
 */
const getAddress = async (contract) => {
  let address = contract.address
  return address
}

/**
 * @description Returns the addresses corresponding to an array of contracts
 * @param contracts {Object} Array of truffle contract objects
 * @returns address[] {String[]}
 */
const getAddresses = async (contracts) => {
  let addresses = contracts.map(function (contract) {
    return contract.address
  })
  return addresses
}

/**
 * @description Send an ethereum transaction and wait until the transaction is mined
 * @param txn {Object} Web3 transaction object
 * @returns txnReceipt {Object} transaction receipt
 */
const sendTransaction = async (txn) => {
  let txnHash = await web3.eth.sendTransaction(txn)
  let txnReceipt = await waitUntilTransactionsMined(txnHash)
  return txnReceipt
}

/**
 * @description Send ethereum transactions and wait until all transactions are mined
 * @param txns {Object} Web3 transactions object
 * @returns txnReceipts {Object} transaction receipts
 */
const sendTransactions = async (txns) => {
  let txnHashes = []
  let txnHash

  for (let txn of txns) {
    txnHash = await sendTransaction(txn)
    txnHashes.push(txnHash)
  }

  return txnHashes
}

/**
 * @description Fails if the input promise is not rejected with an Invalid opcode message
 * @param promise
 */
const expectInvalidOpcode = async (promise) => {
  try {
    await promise
  } catch (error) {
    expect(error.message).to.include('invalid opcode')
    return
  }
  expect.fail('Expected throw not received')
}

/**
 * @description Fails if the input promise is not reject with an Invalid jump message
 * @param promise
 */
const expectInvalidJump = async (promise) => {
  try {
    await promise
  } catch (error) {
    expect(error.message).to.include('invalid JUMP')
    return
  }
  expect.fail('Expected throw not received')
}

/**
 * @description Fails if the input promise is not rejected with an Out of Gas message
 * @param promise
 */
const expectOutOfGas = async (promise) => {
  try {
    await promise
  } catch (error) {
    expect(error.message).to.include('out of gas')
    return
  }
  expect.fail('Expected throw not received')
}

/**
 * @description Mine the local evm
 * @returns promise
 */
const advanceBlock = () => {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method: 'evm_mine',
      id: Date.now(),
    }, (err, res) => {
      return err ? reject(err) : resolve(err)
    })
  })
}

/**
 * @description Advance to input block
 * @param number
 */
const advanceToBlock = async(number) => {
  if (web3.eth.blockNumber > number) {
    throw Error(`block number ${number} is in the past (current is ${web3.eth.blockNumber})`)
  }
  while (web3.eth.blockNumber < number) {
    await advanceBlock()
  }
}

const latestTime = function() {
  return moment.unix(web3.eth.getBlock('latest').timestamp)
}

const increaseTime = function(duration) {
  const id = Date.now()

  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      params: [duration.asSeconds()],
      id: id,
    }, err1 => {
      if (err1) return reject(err1)

      web3.currentProvider.sendAsync({
        jsonrpc: '2.0',
        method: 'evm_mine',
        id: id+1,
      }, (err2, res) => {
        return err2 ? reject(err2) : resolve(res)
      })
    })
  })
}

const getTxnReceiptData = (txnReceipt) => {
  let logs = txnReceipt.logs
  let dataArray = []
  logs.forEach(log => {
    let data = log.data
    if (data) {
      dataArray.push(data)
    } else {
      dataArray.push('no data')
    }
  })

  return dataArray
}

const getTxnReceiptTopics = (txnReceipt) => {
  let logs = txnReceipt.logs

  let topics = logs.map(log => {
    let topics = log.topics
    let result = {
      'functionID': topics[0],
      'parameters': topics.slice(1)
    }
    return result
  })
  return topics
}

module.exports = {
  waitUntilTransactionsMined,
  getBalance,
  getBalances,
  getEtherBalance,
  getEtherBalances,
  inEther,
  inWei,
  inBaseUnits,
  inTokenUnits,
  inCents,
  getAddress,
  getAddresses,
  sendTransaction,
  sendTransactions,
  expectInvalidOpcode,
  expectInvalidJump,
  expectOutOfGas,
  advanceToBlock,
  getTxnReceiptData,
  getTxnReceiptTopics,
  latestTime,
  increaseTime
}

