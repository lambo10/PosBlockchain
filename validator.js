class Validator {
    constructor(address, stake) {
      this.address = address;
      this.stake = stake;
      this.lastSelectedTimestamp = 0;
    }
  
    updateLastSelectedTimestamp() {
      this.lastSelectedTimestamp = Date.now();
    }
  
    getDifficulty() {
      const timeSinceLastSelected = Date.now() - this.lastSelectedTimestamp;
      return this.stake / (1 + timeSinceLastSelected / (60 * 1000)); // Normalize the difficulty based on time in minutes.
    }

    addReward(reward) {
        this.stake += reward;
      }
    
      applyPenalty(penalty) {
        this.stake -= penalty;
      }
  }
  
  export default Validator;
  