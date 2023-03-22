import net from 'net';
import crypto from 'crypto';

class P2PNode {
  constructor(port, seedNodes = []) {
    this.port = port;
    this.peers = [...seedNodes];
    this.nodes = new Map();
    this.server = net.createServer(this.handleConnection.bind(this));
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`P2P node listening on port ${this.port}`);
    });

    this.connectToPeers();
  }

  connectToPeers() {
    const connectNextPeer = () => {
      const peer = this.peers.shift();
      if (!peer) return;

      const [host, port] = peer.split(':');
      const socket = net.createConnection({ host, port }, () => {
        this.handleConnection(socket);
        connectNextPeer();
      });

      socket.on('error', () => {
        setTimeout(connectNextPeer, 1000);
      });
    };

    connectNextPeer();
  }

  handleConnection(socket) {
    const id = crypto.randomBytes(8).toString('hex');
    this.nodes.set(id, socket);

    console.log(`New connection from ${socket.remoteAddress}:${socket.remotePort}, id: ${id}`);

    socket.on('data', (data) => {
      this.handleMessage(data, id);
    });

    socket.on('close', () => {
      this.nodes.delete(id);
      console.log(`Connection closed, id: ${id}`);
    });

    socket.on('error', (err) => {
      console.error(`Connection error, id: ${id}`, err);
    });
  }

  handleMessage(data, senderId) {
    const message = data.toString().trim();
    console.log(`Message from ${senderId}: ${message}`);

    // Handle the message, e.g. process a transaction, add a block, etc.

    // Broadcast the message to other connected nodes
    this.broadcast(message, senderId);
  }

  broadcast(message, excludeId = null) {
    for (const [id, socket] of this.nodes.entries()) {
      if (id !== excludeId) {
        socket.write(message + '\n');
      }
    }
  }
}

export default P2PNode;
