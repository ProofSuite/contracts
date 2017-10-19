  module.exports = async function(callback) {

    const csv = require('csv-parser')
    const json2csv = require('json2csv')

    const fs = require('fs')
    const request = require('async-request')
    const csvdata = require('csvdata')
    const awaitEach = require('await-each')

    let config = require('./config')
    let getTokenBalance = require('./tokenHelpers').getTokenBalance


    const ProofPresaleToken = artifacts.require('./ProofPresaleToken.sol')
    const proofPresaleToken = await ProofPresaleToken.at('0x2469f31A34FCaAc0debf73806cE39B2388874B13')
    const provider = artifacts.options.provider
    const web3 = new Web3(provider)

    let addresses = [];
    var balances = [];

    const writeData = new Promise((resolve, reject) => {
      fs.createReadStream('./addresses.csv')
        .pipe(csv())
        .on('data', function(data) {
          addresses.push(data['Addresses'])
        })
        .on('end', resolve);
    })

    const getBalance = async(address) => {
      let balance = await getTokenBalance(proofPresaleToken, address)
      return { "address": address, "balance": balance }
    }

    async function run() {
      await writeData;

      let tokenBalances = await awaitEach(addresses, async function(address) {
        return await getBalance(address);
      })

      let fields = ['address', 'balance'];
      let csv = json2csv({ data: tokenBalances, fields: fields })

      fs.writeFile('./balances.csv', csv, function(err) {
        if (err) throw err;
        console.log('file saved');
      });

    };

    run();
  }
