var Promise = require('bluebird')
let chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
const expect = chai.expect
chai.should()
chai.use(chaiAsPromised)

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

const getBalance = (address) => {
  let balance = web3.eth.getBalance(address)
  return balance.toNumber()
}

const getBalances = (addresses) => {
  let balances = []
  addresses.map(function (address) { balances.push(getBalance(address)) })
  return balances
}

const getEtherBalance = (address) => {
  let balance = web3.fromWei(web3.eth.getBalance(address), 'ether')
  return balance.toNumber()
}

const getEtherBalances = (addresses) => {
  let balances = []
  addresses.forEach(function (address) { balances.push(getEtherBalance(address)) })
  return balances
}

const inEther = (amountInWei) => {
  let amount = web3.fromWei(amountInWei, 'ether')
  return Number(amount)
}

const inWei = (amountInEther) => {
  let amount = web3.toWei(amountInEther, 'ether')
  return amount.toNumber()
}

// in our case the base units are cents
const inBaseUnits = (tokens) => {
  return tokens * (10 ** 2)
}

const inCents = (tokens) => {
  return tokens * (10 ** 2)
}

const inTokenUnits = (tokenBaseUnits) => {
  return tokenBaseUnits / (10 ** 18)
}

// const deployContract = async (contract) => {

//   let contractAddress = await contract.new()
//   return contractAddress
// }

const deployContract = async (contract, ...args) => {
  let contractAddress = await contract.new(...args)
  return contractAddress
}

const deployContracts = async (contracts) => {
  let results = await Promise.map(contracts, function (contract) {
    return contract.new()
  })

  return results
}

const getAddress = async (contract) => {
  let address = contract.address
  return address
}

const getAddresses = async (contracts) => {
  let addresses = contracts.map(function (contract) {
    return contract.address
  })
  return addresses
}

const expectInvalidOpcode = async (promise) => {
  try {
    await promise
  } catch (error) {
    expect(error.message).to.include('invalid opcode')
    return
  }
  expect.fail('Expected throw not received')
}

const expectInvalidJump = async (promise) => {
  try {
    await promise
  } catch (error) {
    expect(error.message).to.include('invalid JUMP')
    return
  }
  expect.fail('Expected throw not received')
}

const expectOutOfGas = async (promise) => {
  try {
    await promise
  } catch (error) {
    expect(error.message).to.include('out of gas')
    return
  }
  expect.fail('Expected throw not received')
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
  deployContract,
  deployContracts,
  getAddress,
  getAddresses,
  expectInvalidOpcode,
  expectInvalidJump,
  expectOutOfGas
}

