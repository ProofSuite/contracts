var Promise = require('bluebird')
let chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
const expect = chai.expect
chai.should()
chai.use(chaiAsPromised)

/**
 * @description
 * @param txnHashes
 * @returns
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
 * @description
 * @param address
 * @returns
 */
const getBalance = (address) => {
  let balance = web3.eth.getBalance(address)
  return balance.toNumber()
}

/**
 * @description
 * @param addresses
 * @returns
 */
const getBalances = (addresses) => {
  let balances = []
  addresses.map(function (address) { balances.push(getBalance(address)) })
  return balances
}

/**
 * @description
 * @param address
 * @returns
 */
const getEtherBalance = (address) => {
  let balance = web3.fromWei(web3.eth.getBalance(address), 'ether')
  return balance.toNumber()
}

/**
 * @description
 * @param addresses
 * @returns
 */
const getEtherBalances = (addresses) => {
  let balances = []
  addresses.forEach(function (address) { balances.push(getEtherBalance(address)) })
  return balances
}

/**
 * @description
 * @param amountInWei
 * @returns
 */
const inEther = (amountInWei) => {
  let amount = web3.fromWei(amountInWei, 'ether')
  return Number(amount)
}

/**
 * @description
 * @param amountInEther
 * @returns
 */
const inWei = (amountInEther) => {
  let amount = web3.toWei(amountInEther, 'ether')
  return amount.toNumber()
}

// in our case the base units are cents
/**
 * @description
 * @param tokens
 * @returns
 */
const inBaseUnits = (tokens) => {
  return tokens * (10 ** 2)
}

/**
 * @description
 * @param tokens
 * @returns
 */
const inCents = (tokens) => {
  return tokens * (10 ** 2)
}

/**
 * @description
 * @param tokenBaseUnits
 * @returns
 */
const inTOKEN_UNITS = (tokenBaseUnits) => {
  return tokenBaseUnits / (10 ** 18)
}

/**
 * @description
 * @param contract
 * @param params
 * @returns
 */
const deployContract = async (contract, params) => {
  let deployedContract;

  if (params) {
    deployedContract = await contract.new(...params)
  } else {
    deployedContract = await contract.new()
  }
  return deployedContract
}

/**
 * @description
 * @param contracts
 * @returns
 */
const deployContracts = async (contracts) => {
  let results = await Promise.map(contracts, function (contract) {
    return contract.new()
  })

  return results
}

/**
 * @description
 * @param contract
 * @returns
 */
const getAddress = async (contract) => {
  let address = contract.address
  return address
}

/**
 * @description
 * @param contracts
 * @returns
 */
const getAddresses = async (contracts) => {
  let addresses = contracts.map(function (contract) {
    return contract.address
  })
  return addresses
}

/**
 * @description
 * @param txn
 * @returns
 */
const sendTransaction = async (txn) => {
  let txnHash = await web3.eth.sendTransaction(txn)
  let txnReceipt = await waitUntilTransactionsMined(txnHash)
  return txnReceipt
}

/**
 * @description
 * @param txns
 * @returns
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
 * @description
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
 * @description
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
 * @description
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
 * @description
 * @returns
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
 * @description
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

module.exports = {
  waitUntilTransactionsMined,
  getBalance,
  getBalances,
  getEtherBalance,
  getEtherBalances,
  inEther,
  inWei,
  inBaseUnits,
  inTOKEN_UNITS,
  inCents,
  deployContract,
  deployContracts,
  getAddress,
  getAddresses,
  sendTransaction,
  sendTransactions,
  expectInvalidOpcode,
  expectInvalidJump,
  expectOutOfGas,
  advanceToBlock
}

