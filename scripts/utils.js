const decodeEthereumAddress = (encoded) => {
  return '0x' + encoded.slice(26)
}

module.exports = {
  decodeEthereumAddress
}