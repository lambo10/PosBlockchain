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
  
  const blockchain = new PoSBlockchain(validators);

  app.post('/jsonrpc', (req, res) => {
    const { id, method, params } = req.body;
  
    if (method === 'getLatestBlock') {
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
