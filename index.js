import P2PNode from './p2p.js';
import PoSBlockchain from './pos_blockchain.js';
import Validator from './validator.js';

const port = process.argv[2] || 3000;
const seedNodes = process.argv.slice(3);

const node = new P2PNode(port, seedNodes);
node.start();

// Example validators with their stake
const validators = [
  new Validator('validator1', 100),
  new Validator('validator2', 150),
  new Validator('validator3', 200),
];

const blockchain = new PoSBlockchain(validators);

node.handleMessage = (data, senderId) => {
  const message = data.toString().trim();
  console.log(`Message from ${senderId}: ${message}`);

  try {
    const blockData = JSON.parse(message);
    const validator = blockchain.pickValidator();
    if (validator) {
      const newBlock = blockchain.addBlock(blockData, validator.address);
      console.log(`New block added by ${validator.address}: ${JSON.stringify(newBlock)}`);
    } else {
      console.log('No validator available.');
    }
  } catch (err) {
    console.error('Error processing the message:', err);
  }

  // Broadcast the message to other connected nodes
  node.broadcast(message, senderId);
};

