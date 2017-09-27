let config = {
  infura: {
    mainnet: 'https://mainnet.infura.io/Oi27hEUIuGqMsrYGpI7e',
    testnet: 'https://ropsten.infura.io/Oi27hEUIuGqMsrYGpI7e',
    rinkeby: 'https://rinkeby.infura.io/Oi27hEUIuGqMsrYGpI7e',
    kovan: 'https://kovan.infura.io/Oi27hEUIuGqMsrYGpI7e'
  },
  testnet: {
    datadir: '/Users/davidvanisacker/Library/Ethereum/testnet',
    wallet: {
      address: '0x38ef4f14eaced72a030c2a3588210b83b0e4944a',
      password: 'flowersinthefield182'
    }
  },
  rinkeby: {
    datadir: '/Users/davidvanisacker/Library/Ethereum/rinkeby',
    wallet: {
      address: '0x9d919eae7087eae6a7e4452e0b2c05f88613f50e',
      password: 'thisisbullshit'
    }
  },
  mainnet: {
    datadir: '/Users/davidvanisacker/Library/Ethereum',
    wallet: {
      address: '',
      password: ''
    }
  },
  constants: {
    DEFAULT_GAS: 2 * 10 ** 6,
    DEFAULT_LOW_GAS_PRICE: 2 * 10 ** 9,
    DEFAULT_GAS_PRICE: 6 * 10 ** 9,
    DEFAULT_HIGH_GAS_PRICE: 40 * 10 ** 9,
    TOKENS_ALLOCATED_TO_PROOF: 1181031 * (10 ** 18),
    DECIMALS_POINTS: 10 ** 18,
    TOKEN_UNITS: 10 ** 18
  }
}

module.exports = config