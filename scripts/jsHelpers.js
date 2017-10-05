Array.prototype.toNumber = function() {
  return this.map((elem) => { return parseInt(elem) })
}
Array.prototype.sum = function() {
  return this.reduce((pv,cv) => pv+cv, 0)
}