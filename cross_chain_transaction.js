class CrossChainTransaction {
    constructor(fromChain, toChain, fromAddress, toAddress, asset, amount) {
      this.fromChain = fromChain;
      this.toChain = toChain;
      this.fromAddress = fromAddress;
      this.toAddress = toAddress;
      this.asset = asset;
      this.amount = amount;
    }
  }
  
  export default CrossChainTransaction;
  