import crypto from 'crypto';
import Block from './block.js';
import { Transaction, TransactionInput } from './transaction.js';
import Validator from './validator.js';
import Storage from './storage.js';
import SmartContract from './smart_contract.js';
import Shard from './shard.js';
import CrossChainTransaction from './cross_chain_transaction.js';

class PoSBlockchain {
    constructor(validators = [], shardCount = 4, dbPath = './blockchain_data') {
      this.storage = new Storage(dbPath);
      this.validators = validators;
      this.shards = Array.from({ length: shardCount }, (_, index) => new Shard(index));
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

  async addTransaction(transaction) {
    if (!this.isValidTransaction(transaction)) {
      throw new Error('Invalid transaction');
    }

    const latestBlock = await this.getLatestBlock();
    const newData = latestBlock.data.concat(transaction);
    await this.addBlock(newData, this.pickValidator().address);
  }

  isValidTransaction(transaction) {
    const inputAmount = transaction.inputs.reduce((sum, input) => sum + input.amount, 0);
    const outputAmount = transaction.outputs.reduce((sum, output) => sum + output.amount, 0);
    return inputAmount === outputAmount;
  }

  async isValidChain() {
    let index = 1;
    while (true) {
      const currentBlock = await this.storage.get(index);
      if (!currentBlock) {
        break;
      }

      const previousBlock = await this.storage.get(index - 1);
      if (!previousBlock) {
        return false;
      }

      if (currentBlock.hash !== this.calculateHash(currentBlock.index, currentBlock.previousHash, currentBlock.timestamp, currentBlock.data, currentBlock.validatorAddress)) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }

      index++;
    }

    return true;
  }

  pickValidator() {
    const totalStake = this.validators.reduce((sum, validator) => sum + validator.stake, 0);
    const stakeTarget = Math.random() * totalStake;

    let currentStake = 0;
    for (const validator of this.validators) {
      currentStake += validator.stake;

      if (currentStake >= stakeTarget) {
        return validator;
      }
    }

    return this.validators[0];
  }

  registerSmartContract(smartContract) {
    if (smartContract instanceof SmartContract) {
      this.smartContracts.set(smartContract.address, smartContract);
    } else {
      throw new Error('Invalid smart contract');
    }
  }

  async executeSmartContract(transaction) {
    const smartContract = this.smartContracts.get(transaction.to);
    if (!smartContract) {
      throw new Error('Smart contract not found');
    }

    const result = await smartContract.execute(transaction.data, transaction.from);

    if (result.status === 'success') {
      const txOutputs = smartContract.processOutputs(result);
      const newTransaction = new Transaction(transaction.inputs, txOutputs);
      await this.addTransaction(newTransaction);
      return result;
    } else {
      throw new Error(`Smart contract execution failed: ${result.message}`);
    }
  }

  async addTransaction(transaction) {
    if (!this.isValidTransaction(transaction)) {
      throw new Error('Invalid transaction');
    }

    // Assign the transaction to a shard
    const shardIndex = this.getShardIndex(transaction);
    const shard = this.shards[shardIndex];
    await shard.addTransaction(transaction);
  }

  getShardIndex(transaction) {
    // Assign a shard based on the hash of the transaction inputs
    const inputHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(transaction.inputs)).digest('hex');
      const shardIndex = parseInt(inputHash, 16) % this.shards.length;
      return shardIndex;
    }

    
  // Add a new method to handle cross-chain transactions
  async handleCrossChainTransaction(cct) {
    if (!this.isValidCrossChainTransaction(cct)) {
      throw new Error('Invalid cross-chain transaction');
    }

    // Process the transaction on the sending shard/chain
    const fromShard = this.shards[cct.fromChain];
    if (fromShard) {
      await fromShard.addTransaction(cct);
    }

    // Process the transaction on the receiving shard/chain
    const toShard = this.shards[cct.toChain];
    if (toShard) {
      await toShard.addTransaction(cct);
    }
  }

  // Add a new method to validate cross-chain transactions
  isValidCrossChainTransaction(cct) {
    // Implement your validation logic here, e.g., check if the sender has enough balance
    return true;
  }


}

export default PoSBlockchain;

