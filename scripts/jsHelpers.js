Array.prototype.toNumber = function() {
  return this.map((elem) => { return parseInt(elem) })
}