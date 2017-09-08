module.exports = () => {
  return {
    files: [
      'contracts/*.sol'
    ],
    tests: [
      'test/crowdsale.js',
      'test/proofToken.js'
    ],
    debug: true
  }
}