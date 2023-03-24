import express from 'express';
import bodyParser from 'body-parser';
import PoSBlockchain from './pos_blockchain.js';
import Validator from './validator.js';

const app = express();
app.use(bodyParser.json());

const validators = [
    new Validator('validator1', 100),
    new Validator('validator2', 150),
    new Validator('validator3', 200),
  ];
  const currentValidator = validators[0];
  
  const blockchain = new PoSBlockchain(validators,currentValidator);

  app.post('/jsonrpc', async (req, res) => {
    const { id, method, params } = req.body;
  
    if (method === 'eth_protocolVersion') {
        const result = blockchain.getProtocolVersion();
        res.json({ jsonrpc: '2.0', id, result });
      }else if (method === 'eth_chainId') {
        const result = blockchain.getChainId();
        res.json({ jsonrpc: '2.0', id, result });
      }else if (method === 'eth_syncing') {
        const result = await blockchain.getSyncingStatus();
        res.json({ jsonrpc: '2.0', id, result });
      } else if (method === 'eth_coinbase') {
        const result = blockchain.getCoinbase();
        res.json({ jsonrpc: '2.0', id, result });
      } else if (method === 'eth_mining') {
        const result = blockchain.isMining();
        res.json({ jsonrpc: '2.0', id, result });
      } else if (method === 'eth_blockNumber') {
        const result = await blockchain.getBlockNumber();
        res.json({ jsonrpc: '2.0', id, result });
      } else if (method === 'eth_getBlockByNumber') {
        const [blockNumber, includeTransactions] = params;
        const block = await blockchain.getBlockByNumber(blockNumber);
        if (block) {
          const result = {
            number: `0x${block.index.toString(16)}`,
            hash: `0x${block.hash}`,
            parentHash: `0x${block.previousHash}`,
            nonce: null,
            sha3Uncles: null,
            logsBloom: null,
            transactionsRoot: `0x${block.calculateTransactionsRoot()}`,
            stateRoot: `0x${block.getStateRoot()}`,
            miner: `0x${block.validatorAddress}`,
            difficulty: `0x${block.getDifficulty().toString(16)}`,
            totalDifficulty: null,
            extraData: null,
            size: null,
            gasLimit: null,
            gasUsed: null,
            timestamp: `0x${Math.floor(block.timestamp / 1000).toString(16)}`,
            transactions: includeTransactions ? block.data : [],
            uncles: []
          };
          res.json({ jsonrpc: '2.0', id, result });
        } else {
          res.json({ jsonrpc: '2.0', id, error: { code: -32000, message: `Block ${blockNumber} not found` } });
        }
      } else if (method === 'eth_getTransactionByHash') {
        const [txHash] = params;
        const result = await blockchain.getTransactionByHash(txHash);
        if (result) {
          res.json({ jsonrpc: '2.0', id, result });
        } else {
          res.json({ jsonrpc: '2.0', id, error: { code: -32000, message: 'Transaction not found' } });
        }
      } else if (method === 'eth_getTransactionReceipt') {
        const txHash = params[0];
        const block = await blockchain.getBlockByTransactionHash(txHash);
        if (!block) {
          res.json({ jsonrpc: '2.0', id, error: { code: -32000, message: 'Transaction not found' } });
          return;
        }
        const tx = block.data.find((tx) => tx.hash === txHash);
        if (!tx) {
          res.json({ jsonrpc: '2.0', id, error: { code: -32000, message: 'Transaction not found' } });
          return;
        }
        const receipt = await blockchain.getTransactionReceipt(txHash);
        res.json({ jsonrpc: '2.0', id, result: receipt });
      }
    else if (method === 'eth_sendTransaction') {
        try {
          const transaction = new Transaction(params);
          const receipt = blockchain.addTransaction(transaction);
          res.json({ jsonrpc: '2.0', id, result: receipt });
        } catch (error) {
          res.json({ jsonrpc: '2.0', id, error: { code: -32000, message: error.message } });
        }
      }
      else if (method === 'eth_getBalance') {
        const { address, blockNumber } = params;
        const balance = blockchain.getBalance(address, blockNumber);
        res.json({ jsonrpc: '2.0', id, result: balance });
      }else if (method === 'eth_getCode') {
        const [address, blockNumber] = params;
        const code = blockchain.getCode(address, blockNumber);
        res.json({ jsonrpc: '2.0', id, result: code });
      }
      else if (method === 'eth_estimateGas') {
        try {
          const transaction = new Transaction(params);
          const gas = blockchain.estimateGas(transaction);
          res.json({ jsonrpc: '2.0', id, result: gas });
        } catch (error) {
          res.json({ jsonrpc: '2.0', id, error: { code: -32000, message: error.message } });
        }
      }
      else if (method === 'eth_call') {
        const { to, data } = params[0];
        const blockNumber = params[1];
        const block = blockNumber ? await blockchain.getBlockByNumber(blockNumber) : blockchain.getLatestBlock();
        const contract = block.getContractByAddress(to);
        const result = contract.call(data);
        res.json({ jsonrpc: '2.0', id, result });
      }                  
       else if (method === 'getLatestBlock') {
      const result = blockchain.getLatestBlock();
      res.json({ jsonrpc: '2.0', id, result });
    } else if (method === 'addTransaction') {
      try {
        const transaction = new Transaction(params.inputs, params.outputs);
        blockchain.addTransaction(transaction);
        res.json({ jsonrpc: '2.0', id, result: 'Transaction added' });
      } catch (error) {
        res.json({ jsonrpc: '2.0', id, error: { code: -32603, message: 'Invalid transaction' } });
      }
    } else {
      res.json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } });
    }
  });

  const PORT = process.env.PORT || 3590;
app.listen(PORT, () => {
  console.log(`JSON-RPC server listening on port ${PORT}`);
});
