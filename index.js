import P2PNode from './p2p.js';
import PoSBlockchain from './pos_blockchain.js';
import Validator from './validator.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.argv[2] || 3000;
const seedNodes = process.argv.slice(3);

const node = new P2PNode(port, seedNodes);
node.start();

const validatorJsonPath = path.join(__dirname, 'validators.json');
const validatorData = JSON.parse(fs.readFileSync(validatorJsonPath, 'utf8'));

const validators = validatorData.validators.map(data => new Validator(data.address, data.stake));

const currentValidatorAddress = validatorData.CURRENT_VALIDATOR_ADDRESS || 'validator1';
const currentValidator = validators.find(validator => validator.address === currentValidatorAddress);

if (!currentValidator) {
  console.error(`No validator found with the address "${currentValidatorAddress}"`);
  process.exit(1);
}

const blockchain = new PoSBlockchain(validators, currentValidator);

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

// Example: start mining
currentValidator.startMining();
