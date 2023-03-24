import crypto from 'crypto';
import Block from './block.js';
import Storage from './storage.js';
import Validator from './validator.js';

class Shard {
  constructor(index, validators = [], dbPath = `./shard_data_${index}`) {
    this.storage = new Storage(dbPath);
    this.index = index;
    this.validators = validators;
    this.init();
  }

  async init() {
    const genesisBlock = await this.storage.get(0);
    if (genesisBlock) {
      this.chain = [genesisBlock];
    } else {
      const newGenesisBlock = this.createGenesisBlock();
      await this.storage.put(0, newGenesisBlock);
      this.chain = [newGenesisBlock];
    }
  }

  createGenesisBlock() {
    return new Block(0, '0', Date.now(), [], '0000000000000000', '');
  }

  async getLatestBlock() {
    let index = 0;
    let block = null;
    while (true) {
      const currentBlock = await this.storage.get(index);
      if (!currentBlock) {
        break;
      }
      block = currentBlock;
      index++;
    }
    return block;
  }

  async addTransaction(transaction) {
    // Add the transaction to the shard's block
    const latestBlock = await this.getLatestBlock();
    const newData = latestBlock.data.concat(transaction);
    await this.addBlock(newData, this.pickValidator().address);
  }

  async addBlock(data, validatorAddress) {
    const latestBlock = await this.getLatestBlock();
    const index = latestBlock.index + 1;
    const timestamp = Date.now();
    const previousHash = latestBlock.hash;
    const hash = this.calculateHash(index, previousHash, timestamp, data, validatorAddress);

    const newBlock = new Block(index, previousHash, timestamp, data, hash, validatorAddress);
    await this.storage.put(index, newBlock);
    this.chain.push(newBlock);
    return newBlock;
  }

  calculateHash(index, previousHash, timestamp, data, validatorAddress) {
    const input = `${index}${previousHash}${timestamp}${JSON.stringify(data)}${validatorAddress}`;
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  pickValidator() {
    const totalStake = this.validators.reduce((sum, validator) => sum + validator.stake, 0);
    const stakeTarget = Math.random() * totalStake;
    let accumulatedStake = 0;
    for (const validator of this.validators) {
      accumulatedStake += validator.stake;
      if (accumulatedStake >= stakeTarget) {
        return validator;
      }
    }
    // Fallback to the last validator if none were selected
    return this.validators[this.validators.length - 1];
  }
  
}

export default Shard;
