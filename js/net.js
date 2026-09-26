// Tiny host-authoritative networking over PeerJS (WebRTC, no server of our own).
// Solo play uses the same Hub with no peers, so every mode runs one code path.
const PREFIX = 'ballknow-v1-';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export class Hub {
  constructor() {
    this.isHost = true;
    this.myId = 'me';
    this.conns = new Map();
    this.onMsg = () => {};          // every client (incl. host) renders from these
    this.onHostMsg = () => {};      // host controller: (fromId, msg)
    this.onJoin = () => {};
    this.onLeave = () => {};
    this.onDisconnect = () => {};
    this.code = null;
  }

  static solo() {
    return new Hub();
  }

  static host() {
    const hub = new Hub();
    return new Promise((resolve, reject) => {
      const tryOpen = (attempt) => {
        const code = Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
        const peer = new window.Peer(PREFIX + code);
        peer.on('open', (id) => {
          hub.peer = peer;
          hub.code = code;
          hub.myId = id;
          resolve(hub);
        });
        peer.on('connection', (conn) => {
          conn.on('open', () => hub.conns.set(conn.peer, conn));
          conn.on('data', (m) => {
            if (m && m.t === 'hello') hub.onJoin(conn.peer, m);
            else hub.onHostMsg(conn.peer, m);
          });
          conn.on('close', () => { hub.conns.delete(conn.peer); hub.onLeave(conn.peer); });
          conn.on('error', () => { hub.conns.delete(conn.peer); hub.onLeave(conn.peer); });
        });
        peer.on('error', (e) => {
          if (e.type === 'unavailable-id' && attempt < 4) { peer.destroy(); tryOpen(attempt + 1); }
          else if (!hub.code) reject(e);
        });
        peer.on('disconnected', () => { try { peer.reconnect(); } catch {} });
      };
      tryOpen(0);
    });
  }

  static join(code, hello) {
    const hub = new Hub();
    hub.isHost = false;
    return new Promise((resolve, reject) => {
      const peer = new window.Peer();
      const timer = setTimeout(() => reject(new Error('Could not reach that room. Check the code.')), 12000);
      peer.on('open', (id) => {
        hub.peer = peer;
        hub.myId = id;
        hub.code = code.toUpperCase();
        const conn = peer.connect(PREFIX + hub.code, { reliable: true });
        hub.hostConn = conn;
        conn.on('open', () => {
          clearTimeout(timer);
          conn.send({ t: 'hello', ...hello });
          resolve(hub);
        });
        conn.on('data', (m) => hub.onMsg(m));
        conn.on('close', () => hub.onDisconnect());
      });
      peer.on('error', (e) => {
        clearTimeout(timer);
        reject(e.type === 'peer-unavailable' ? new Error('No room with that code.') : e);
      });
    });
  }

  broadcast(m) {
    for (const c of this.conns.values()) { try { c.send(m); } catch {} }
    queueMicrotask(() => this.onMsg(m));
  }

  sendTo(id, m) {
    if (id === this.myId) queueMicrotask(() => this.onMsg(m));
    else { try { this.conns.get(id)?.send(m); } catch {} }
  }

  toHost(m) {
    if (this.isHost) queueMicrotask(() => this.onHostMsg(this.myId, m));
    else { try { this.hostConn.send(m); } catch {} }
  }

  close() {
    try { this.peer?.destroy(); } catch {}
  }
}
