class Block {
  constructor(index, previousHash, timestamp, data, hash, validatorAddress) {
    this.index = index;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
    this.hash = hash;
    this.validatorAddress = validatorAddress;
  }
}

export default Block;
