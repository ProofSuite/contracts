let config = {
  infura: {
    ethereum: 'https://mainnet.infura.io/Oi27hEUIuGqMsrYGpI7e',
    ropsten: 'https://ropsten.infura.io/Oi27hEUIuGqMsrYGpI7e',
    rinkeby: 'https://rinkeby.infura.io/Oi27hEUIuGqMsrYGpI7e',
    kovan: 'https://kovan.infura.io/Oi27hEUIuGqMsrYGpI7e'
  },
  constants: {
    DEFAULT_GAS: 2 * 10 ** 6,
    MAX_GAS: 4.7 * 10 ** 6,
    DEFAULT_LOW_GAS_PRICE: 2 * 10 ** 9,
    DEFAULT_GAS_PRICE: 6 * 10 ** 9,
    DEFAULT_HIGH_GAS_PRICE: 40 * 10 ** 9,
    TOKENS_ALLOCATED_TO_PROOF: 1181031 * (10 ** 18),
    DECIMALS_POINTS: 10 ** 18,
    TOKEN_UNITS: 10 ** 18
  }
}

module.exports = config