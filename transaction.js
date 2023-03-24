// transaction.js
import { sign, verify } from './crypto_utils.js';

class TransactionInput {
  constructor(address, amount, publicKey, signature = null) {
    this.address = address;
    this.amount = amount;
    this.publicKey = publicKey;
    this.signature = signature;
  }

  sign(privateKey) {
    this.signature = sign(privateKey, this.getDataToSign());
  }

  getDataToSign() {
    return `${this.address}${this.amount}`;
  }

  isValid() {
    return verify(this.publicKey, this.getDataToSign(), this.signature);
  }
}

class TransactionOutput {
  constructor(address, amount) {
    this.address = address;
    this.amount = amount;
  }
}

class Transaction {
  constructor(inputs, outputs) {
    this.inputs = inputs;
    this.outputs = outputs;
  }

  static createNewTransaction(senderPrivateKey, senderPublicKey, recipientAddress, amount, utxos) {
    const senderAddress = senderPublicKey;

    // Find UTXOs to cover the transaction amount
    let inputAmount = 0;
    const inputs = [];
    for (const utxo of utxos) {
      inputs.push(new TransactionInput(senderAddress, utxo.amount, senderPublicKey));
      inputAmount += utxo.amount;

      if (inputAmount >= amount) {
        break;
      }
    }

    if (inputAmount < amount) {
      throw new Error('Insufficient balance');
    }

    // Calculate change and create transaction outputs
    const change = inputAmount - amount;
    const outputs = [new TransactionOutput(recipientAddress, amount)];

    if (change > 0) {
      outputs.push(new TransactionOutput(senderAddress, change));
    }

    // Sign transaction inputs
    for (const input of inputs) {
      input.sign(senderPrivateKey);
    }

    return new Transaction(inputs, outputs);
  }
}

class ValidatorRegistrationTransaction extends Transaction {
  constructor(senderPrivateKey, senderPublicKey, newValidatorAddress, stakeAmount, utxos) {
    const registrationFee = 10; // Define a registration fee if needed

    // Find UTXOs to cover the transaction amount
    let inputAmount = 0;
    const inputs = [];
    for (const utxo of utxos) {
      inputs.push(new TransactionInput(utxo.address, utxo.amount, senderPublicKey));
      inputAmount += utxo.amount;

      if (inputAmount >= stakeAmount + registrationFee) {
        break;
      }
    }

    if (inputAmount < stakeAmount + registrationFee) {
      throw new Error('Insufficient balance');
    }

    // Calculate change and create transaction outputs
    const change = inputAmount - (stakeAmount + registrationFee);
    const outputs = [
      new TransactionOutput(newValidatorAddress, stakeAmount),
      new TransactionOutput(senderPublicKey, -registrationFee), // Deduct the registration fee from the sender's balance
    ];

    if (change > 0) {
      outputs.push(new TransactionOutput(senderPublicKey, change));
    }

    // Sign transaction inputs
    for (const input of inputs) {
      input.sign(senderPrivateKey);
    }

    super(inputs, outputs);

    this.newValidatorAddress = newValidatorAddress;
    this.stakeAmount = stakeAmount;
  }
}

export { Transaction, TransactionInput, TransactionOutput, ValidatorRegistrationTransaction };
