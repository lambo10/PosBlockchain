import crypto from 'crypto';
import Block from './block.js';
import { Transaction, TransactionInput, ValidatorRegistrationTransaction } from './transaction.js';
import Validator from './validator.js';
import Storage from './storage.js';
import P2PNode from './p2p.js';

class PoSBlockchain {
  constructor(validators = [], currentValidator, dbPath = './blockchain_data', chainId = 94, seedNodes = []) {
    this.storage = new Storage(dbPath);
    this.validators = validators;
    this.currentValidator = currentValidator;
    this.chainId = chainId;
    this.init();
    this.p2pNode = new P2PNode(this.currentValidator.rpcPort, seedNodes, this.handleMessage.bind(this));
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

    // Broadcast the new block to other nodes in the network
    await this.broadcastBlock(newBlock);

    return newBlock;
  }

  calculateHash(index, previousHash, timestamp, data, validatorAddress) {
    const input = `${index}${previousHash}${timestamp}${JSON.stringify(data)}${validatorAddress}`;
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  async addTransaction(transaction) {
    if (!await this.isValidTransaction(transaction)) {
      throw new Error('Invalid transaction');
    }

    const latestBlock = await this.getLatestBlock();
    const newData = latestBlock.data.concat(transaction);
    await this.addBlock(newData, this.pickValidator().address);

    if (transaction instanceof ValidatorRegistrationTransaction) {
      const newValidator = new Validator(
        transaction.newValidatorAddress,
        transaction.stakeAmount,
      );
      this.validators.push(newValidator);

      // Save the updated validator list to storage and broadcast to the network
      await this.saveValidatorsToFile();
      await this.broadcastUpdatedValidators();
    } else {
      // Broadcast the new transaction to other nodes in the network
      await this.broadcastTransaction(transaction);
    }
  }

  async isValidTransaction(transaction) {
    const inputAmount = transaction.inputs.reduce((sum, input) => sum + input.amount, 0);
    const outputAmount = transaction.outputs.reduce((sum, output) => sum + output.amount, 0);
  
    // Check that the input amount is greater than or equal to the output amount
    if (inputAmount < outputAmount) {
      return false;
    }
  
    // Check if transaction inputs are unspent and belong to the sender
    for (const input of transaction.inputs) {
      const unspentOutput = await this.getUnspentOutput(input.address, input.amount);
      if (!unspentOutput || !unspentOutput.isValidInput(input)) {
        return false;
      }
    }
  
    return true;
  }
  

  async getUnspentOutput(address, amount) {
    let index = 1;
    while (true) {
      const block = await this.storage.get(index);
      if (!block) {
        break;
      }

      const unspentOutput = block.data
        .flatMap((tx) => tx.outputs)
        .find((output) => output.address === address && output.amount === amount && output.spentBy === null);

      if (unspentOutput) {
        return new UnspentOutput(index, unspentOutput);
      }

      index++;
    }

    return null;
  }

  async broadcastTransaction(transaction) {
    const message = {
      type: 'transaction',
      data: JSON.stringify(transaction),
    };
    await this.broadcast(message);
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

    // Broadcast the new block to other nodes in the network
    await this.broadcastBlock(newBlock);

    return newBlock;
  }

  async broadcastBlock(block) {
    const message = {
      type: 'block',
      data: JSON.stringify(block),
    };
    await this.broadcast(message);
  }

  async broadcastUpdatedValidators() {
    const message = {
      type: 'validators',
      data: JSON.stringify(this.validators),
    };
    await this.broadcast(message);
  }

  async handleMessage(message, senderId) {
    const { type, data } = JSON.parse(message);

    switch (type) {
      case 'transaction': {
        const transaction = JSON.parse(data);
        try {
          await this.addTransaction(transaction);
        } catch (error) {
          console.error('Error adding transaction:', error);
        }
        break;
      }
      case 'block': {
        const blockData = message.payload;
        const newBlock = new Block(blockData.index, blockData.previousHash, blockData.timestamp, blockData.data, blockData.hash, blockData.validatorAddress);
        if (this.isValidBlock(newBlock)) {
        this.chain.push(newBlock);
        await this.storage.put(newBlock.index, newBlock);
        console.log("Added block ${newBlock.index} to the chain");
        } else {
        console.log("Invalid block received from peer: ${peer.id}");
        }
        break;
        }
        case 'transaction': {
        const transactionData = message.payload;
        const newTransaction = new Transaction(
        transactionData.inputs.map(input => new TransactionInput(input.address, input.amount, input.publicKey, input.signature)),
        transactionData.outputs.map(output => new TransactionOutput(output.address, output.amount)),
        );
        
        if (this.isValidTransaction(newTransaction)) {
        await this.addBlock([newTransaction], this.pickValidator().address);
        console.log('Transaction added to a new block');
        } else {
        console.log("Invalid transaction received from peer: ${peer.id}");
        }
        break;
        }
        case 'validators': {
          const validatorsData = JSON.parse(message.payload);
          const newValidators = validatorsData.validators.map(({ address, stake }) => new Validator(address, stake));
          this.updateValidators(newValidators);
          
          break;
          }
          
          default:
          console.warn("Received unknown message type: ${message.type}");
          break;
          }
          
          }
          
          async broadcastMessage(type, payload) {
          const message = {
          type,
          payload,
          };
          
          for (const [id, socket] of this.nodes.entries()) {
          socket.write(JSON.stringify(message) + '\n');
          }
          }
          
          async broadcastTransaction(transaction) {
          const message = JSON.stringify({
          type: 'transaction',
          payload: JSON.stringify(transaction),
          });
          
          await this.broadcastMessage('transaction', message);
          }
          
          async broadcastBlock(block) {
          const message = JSON.stringify({
          type: 'block',
          payload: JSON.stringify(block),
          });
          
          await this.broadcastMessage('block', message);
          }
          
          async broadcastValidators(validators) {
          const message = JSON.stringify({
          type: 'validators',
          payload: JSON.stringify({
          validators: validators.map((validator) => ({
          address: validator.address,
          stake: validator.stake,
          })),
          }),
          });
          
          await this.broadcastMessage('validators', message);
          }
          
          async initValidatorsFromPeers() {
          const validatorMessages = await Promise.all(
          this.peers.map((peer) => {
          return new Promise((resolve, reject) => {
          const client = net.createConnection({ host: peer.host, port: peer.port }, () => {
          client.write(JSON.stringify({ type: 'validators' }) + '\n');
          });
          
          client.on('error', () => {
            reject();
          });
      
          let data = '';
          client.on('data', (chunk) => {
            data += chunk.toString();
            try {
              const message = JSON.parse(data);
              if (message.type === 'validators') {
                resolve(message.payload);
                client.end();
              }
            } catch (error) {}
          });
        });
      })
      );
      const allValidators = validatorMessages
.filter((validators) => validators !== undefined)
.map((validators) => JSON.parse(validators).validators)
.flat();

const uniqueValidators = allValidators.reduce((validators, validator) => {
if (!validators.has(validator.address)) {
validators.set(validator.address, validator);
}
return validators;
}, new Map());

return Array.from(uniqueValidators.values()).map(({ address, stake }) => new Validator(address, stake));
}


async isValidBlock(block) {
  const index = block.index;
  const previousHash = block.previousHash;
  const timestamp = block.timestamp;
  const data = block.data;
  const hash = block.hash;
  const validatorAddress = block.validatorAddress;

  // Check that the block's index is one greater than the previous block's index
  const previousBlock = await this.storage.get(index - 1);
  if (!previousBlock) {
    return false;
  }
  if (previousBlock.hash !== previousHash) {
    return false;
  }

  // Check that the block's hash is valid
  if (hash !== this.calculateHash(index, previousHash, timestamp, data, validatorAddress)) {
    return false;
  }

  // Check that the block was mined by a valid validator
  if (!this.getValidators().some(validator => validator.address === validatorAddress)) {
    return false;
  }

  // Check that all transactions in the block are valid
  for (const transaction of data) {
    if (!await this.isValidTransaction(transaction)) {
      return false;
    }
  }

  return true;
}

updateValidators(validators) {
  this.validators = validators;
}

getValidators() {
  return this.validators;
}

async calculateBalance(address) {
  let balance = 0;
  let index = 1;
  while (true) {
    const block = await this.storage.get(index);
    if (!block) {
      break;
    }
    for (const transaction of block.data) {
      for (const output of transaction.outputs) {
        if (output.address === address) {
          balance += output.amount;
        }
      }
      for (const input of transaction.inputs) {
        if (input.address === address) {
          balance -= input.amount;
        }
      }
    }
    index++;
  }
  return balance;
}

async isValidChain() {
  let index = 1;
  let previousBlock = this.chain[0];
  while (true) {
    const block = await this.storage.get(index);
    if (!block) {
      break;
    }
    if (block.previousHash !== previousBlock.hash) {
      return false;
    }
    if (!await this.isValidBlock(block)) {
      return false;
    }
    previousBlock = block;
    index++;
  }
  return true;
}

getChainId() {
  return this.chainId.toString(16);
}

async eth_blockNumber() {
  const latestBlock = await this.getLatestBlock();
  return latestBlock.index;
}

async getBlockByNumber(blockNumber) {
  const block = await this.storage.get(blockNumber);
  return block;
}

async getTransactionByHash(txHash) {
  let index = 1;
  while (true) {
    const block = await this.storage.get(index);
    if (!block) {
      break;
    }
    for (const transaction of block.data) {
      if (transaction.hash === txHash) {
        return transaction;
      }
    }
    index++;
  }
  return null;
}

getBlockByTransactionHash(hash) {
  const block = this.chain.find(block => {
    return block.transactions.find(tx => tx.hash === hash);
  });

  if (!block) {
    return null;
  }

  const blockNumber = block.index;
  const blockTimestamp = block.timestamp;
  const blockTransactions = block.transactions.map(tx => {
    return {
      blockHash: block.hash,
      blockNumber: block.index,
      from: tx.from,
      gas: tx.gas,
      gasPrice: tx.gasPrice,
      hash: tx.hash,
      input: tx.data,
      nonce: tx.nonce,
      to: tx.to,
      transactionIndex: block.transactions.indexOf(tx),
      value: tx.value,
      v: tx.v,
      r: tx.r,
      s: tx.s
    };
  });

  return {
    blockHash: block.hash,
    blockNumber: blockNumber,
    from: block.miner,
    gas: block.gasUsed,
    gasPrice: 0, // This value is not stored in the block in PoS
    hash: block.hash,
    input: "0x",
    nonce: 0, // This value is not stored in the block in PoS
    to: null, // This value is not stored in the block in PoS
    transactionIndex: blockTransactions.findIndex(tx => tx.hash === hash),
    value: 0, // This value is not stored in the block in PoS
    v: null, // This value is not stored in the block in PoS
    r: null, // This value is not stored in the block in PoS
    s: null, // This value is not stored in the block in PoS
    blockTimestamp: blockTimestamp,
    transactions: blockTransactions
  };
}

getBalance(address, blockNumber) {
  const block = blockNumber ? this.getBlockByNumber(blockNumber) : this.getLatestBlock();
  let balance = 0;
  for (const tx of block.data) {
    if (tx.from === address) {
      balance -= tx.value;
    }
    if (tx.to === address) {
      balance += tx.value;
    }
  }
  return balance;
}

getContractByAddress(address) {
  for (const block of this.chain) {
    for (const tx of block.data) {
      if (tx.to === address && tx.contract) {
        return tx.contract;
      }
    }
  }
  return null;
}

getCode(address, blockNumber) {
  const block = blockNumber ? this.getBlockByNumber(blockNumber) : this.getLatestBlock();
  const contract = block.getContractByAddress(address);
  if (contract) {
    return contract.code;
  }
  return '0x';
}

async estimateGas(from, to, value, data) {
  const tx = new Transaction({ from, to, value, data });
  const gasLimit = await this.getBlockGasLimit();
  const blockNumber = await this.getBlockNumber();
  const block = await this.getBlockByNumber(blockNumber);
  const sender = this.getValidatorByAddress(from);

  if (!sender) {
    throw new Error('Invalid sender address');
  }

  if (!tx.isValid()) {
    throw new Error('Invalid transaction');
  }

  const gasUsed = block.calculateGasUsed(tx);
  const gasPrice = tx.gasPrice || 1;
  const maxGas = gasLimit - gasUsed;
  const gas = Math.min(maxGas, gasPrice * gasUsed);

  return gas;
}



}

export default PoSBlockchain;
      
          
