import http from 'http';
import { parse } from 'url';
import { Transaction, TransactionInput } from './transaction.js';
import PoSBlockchain from './pos_blockchain.js';
import Validator from './validator.js';

const validators = [new Validator('validator1', 50), new Validator('validator2', 100)];
const blockchain = new PoSBlockchain(validators);

const server = http.createServer(async (req, res) => {
  const { method, url } = req;
  const { pathname } = parse(url, true);

  if (method === 'GET' && pathname === '/blocks') {
    const blocks = [];
    let index = 0;
    while (true) {
      const block = await blockchain.storage.get(index);
      if (!block) {
        break;
      }
      blocks.push(block);
      index++;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(blocks));
  } else if (method === 'POST' && pathname === '/transactions') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { inputs, outputs } = JSON.parse(body);
        const transaction = new Transaction(inputs.map(input => new TransactionInput(input.address, input.amount)), outputs);
        await blockchain.addTransaction(transaction);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Transaction added' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else if (method === 'GET' && pathname === '/validators') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(validators));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = process.env.PORT || 3744;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
