PoS Blockchain Documentation
Getting Started
1. Initialize a New Node
To start a new node, create an index.js file (if you haven't already) and use the following code snippet:
javascript

import PoSBlockchain from './pos_blockchain.js'; import fs from 'fs/promises'; async function main() { const validatorData = JSON.parse(await fs.readFile('./validators.json', 'utf8')); const validators = validatorData.validators; const currentValidatorAddress = validatorData.CURRENT_VALIDATOR_ADDRESS; const blockchain = new PoSBlockchain(validators, currentValidatorAddress); blockchain.start(); } main();
This code initializes the PoS blockchain using the validators provided in the validators.json file.
2. Connect to an Existing Node
In the index.js file, to connect to an existing node, modify the following line:
javascript

const blockchain = new PoSBlockchain(validators, currentValidatorAddress);

Replace it with:
javascript

const blockchain = new PoSBlockchain(validators, currentValidatorAddress, [ { address: 'existing-node-ip', port: 3000 }, ]);

This will connect your node to the existing node with the IP address existing-node-ip on port 3000.
3. Join the Validator List
To join the validator list, you'll need to create and broadcast a ValidatorRegistrationTransaction. In the index.js file, you can do this by adding the following code snippet:
javascript

import { ValidatorRegistrationTransaction } from './transaction.js'; // Replace these variables with your data const senderPrivateKey = 'your-private-key'; const senderPublicKey = 'your-public-key'; const newValidatorAddress = 'new-validator-address'; const stakeAmount = 100; const utxos = await blockchain.getUnspentTransactionOutputs(senderPublicKey); const registrationTransaction = ValidatorRegistrationTransaction.createNewTransaction( senderPrivateKey, senderPublicKey, newValidatorAddress, stakeAmount, utxos ); await blockchain.addTransaction(registrationTransaction);

4. Set Validator Address and Port
In the validators.json file, you can set the CURRENT_VALIDATOR_ADDRESS field to the address of the validator you want to use:
json

{ "validators": [ ... ], "CURRENT_VALIDATOR_ADDRESS": "your-validator-address" }

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



Deploying Smart Contracts on the PoS Blockchain
In the PoS blockchain you've built, smart contracts are deployed using the SmartContract class. The SmartContract class allows you to create, deploy, execute transactions on, and validate transactions for a smart contract. Here's a step-by-step guide on how to deploy a smart contract to your PoS blockchain:

1. Create a Smart Contract
First, write the smart contract code in a separate file. For this example, let's assume you've written an ERC-20 token smart contract and saved it in a file called erc20_token.sol.

2. Compile the Smart Contract
Compile the smart contract using a Solidity compiler like solc. This step will generate the compiled bytecode of the smart contract, which you'll need to deploy it. Save the compiled bytecode in a variable or a file.

3. Import the SmartContract Class
In your index.js file, import the SmartContract class:

javascript
Copy code
import SmartContract from './smart_contract.js';
4. Instantiate a SmartContract Object
Create a new instance of the SmartContract class, providing the compiled bytecode, gas limit, and sender's address:

javascript
Copy code
const compiledBytecode = 'your-compiled-bytecode';
const gasLimit = 3000000; // Replace with an appropriate gas limit
const sender = 'sender-address';

const erc20TokenContract = new SmartContract(compiledBytecode, gasLimit, sender);
5. Deploy the Smart Contract
Deploy the smart contract to the PoS blockchain by calling the deploy() method of the SmartContract object:

javascript
Copy code
await erc20TokenContract.deploy();
After deployment, the smart contract's address will be stored in the address property of the SmartContract object:

javascript
Copy code
const contractAddress = erc20TokenContract.address;
You can now use this address to interact with the smart contract on the PoS blockchain.

6. Interacting with the Smart Contract
To interact with the deployed smart contract, create transactions with the appropriate to, inputData, value, and gasLimit fields, and then call the execute() method of the SmartContract object:

javascript
Copy code
const transaction = {
  to: contractAddress,
  inputData: 'input-data', // Encoded contract function call and arguments
  value: 0, // Replace with an appropriate value
  gasLimit: 100000, // Replace with an appropriate gas limit
};

const result = await erc20TokenContract.execute(transaction);
The result object will contain information about the transaction execution, including the return value and any updates to the smart contract's state.




