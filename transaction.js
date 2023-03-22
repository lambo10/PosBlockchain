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

  class TransactionOutput {
    constructor(address, amount) {
      this.address = address;
      this.amount = amount;
    }
  }
  
  export { Transaction, TransactionInput, TransactionOutput };
  
  