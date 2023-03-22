import fs from 'fs/promises';
import path from 'path';

class Storage {
    constructor(dbPath) {
        this.dbPath = dbPath;
        this.init();
      }
    
    async init() {
        try {
          await fs.access(this.dbPath);
        } catch (err) {
          if (err.code === 'ENOENT') {
            await fs.mkdir(this.dbPath);
          } else {
            throw err;
          }
        }
    }

  async get(key) {
    const filePath = path.join(this.dbPath, key.toString());
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      if (err.code === 'ENOENT') {
        return null;
      }
      throw err;
    }
  }

  async put(key, value) {
    const filePath = path.join(this.dbPath, key.toString());
    await fs.writeFile(filePath, JSON.stringify(value));
  }

  async delete(key) {
    const filePath = path.join(this.dbPath, key.toString());
    try {
      await fs.unlink(filePath);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
  }
}

export default Storage;
