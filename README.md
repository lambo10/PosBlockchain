PoS Blockchain Documentation
Getting Started
1. Initialize a New Node
To start a new node, create an index.js file (if you haven't already) and use the following code snippet:

javascript
Copy code
import PoSBlockchain from './pos_blockchain.js';
import fs from 'fs/promises';

async function main() {
  const validatorData = JSON.parse(await fs.readFile('./validators.json', 'utf8'));
  const validators = validatorData.validators;
  const currentValidatorAddress = validatorData.CURRENT_VALIDATOR_ADDRESS;

  const blockchain = new PoSBlockchain(validators, currentValidatorAddress);
  blockchain.start();
}

main();
This code initializes the PoS blockchain using the validators provided in the validators.json file.

2. Connect to an Existing Node
In the index.js file, to connect to an existing node, modify the following line:

javascript
Copy code
const blockchain = new PoSBlockchain(validators, currentValidatorAddress);
Replace it with:

javascript
Copy code
const blockchain = new PoSBlockchain(validators, currentValidatorAddress, [
  { address: 'existing-node-ip', port: 3000 },
]);
This will connect your node to the existing node with the IP address existing-node-ip on port 3000.

3. Join the Validator List
To join the validator list, you'll need to create and broadcast a ValidatorRegistrationTransaction. In the index.js file, you can do this by adding the following code snippet:

javascript
Copy code
import { ValidatorRegistrationTransaction } from './transaction.js';

// Replace these variables with your data
const senderPrivateKey = 'your-private-key';
const senderPublicKey = 'your-public-key';
const newValidatorAddress = 'new-validator-address';
const stakeAmount = 100;

const utxos = await blockchain.getUnspentTransactionOutputs(senderPublicKey);
const registrationTransaction = ValidatorRegistrationTransaction.createNewTransaction(
  senderPrivateKey,
  senderPublicKey,
  newValidatorAddress,
  stakeAmount,
  utxos
);
await blockchain.addTransaction(registrationTransaction);
4. Set Validator Address and Port
In the validators.json file, you can set the CURRENT_VALIDATOR_ADDRESS field to the address of the validator you want to use:

json
Copy code
{
  "validators": [ ... ],
  "CURRENT_VALIDATOR_ADDRESS": "your-validator-address"
}
5. Add PoS Blockchain to MetaMask
To add your PoS blockchain to MetaMask, follow these steps:

Open MetaMask and click on the network dropdown at the top of the window.
Click on "Custom RPC" at the bottom of the list.
Fill in the "Network Name" with a name of your choice, for example, "My PoS Blockchain".
Enter the "New RPC URL", which should be the URL of the node you want to connect to (e.g., http://your-node-ip:your-node-port).
Leave the "Chain ID" field blank or enter a unique identifier for your blockchain.
(Optional) Fill in the "Currency Symbol" and "Block Explorer URL" fields.
Click "Save" to add your PoS blockchain to MetaMask.
Now you should be able to interact with your PoS blockchain using MetaMask.