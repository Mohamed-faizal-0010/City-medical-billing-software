const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../node_modules/vite/dist/client/client.mjs');

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf-8');
  let changed = false;

  // Guard ws.send inside createWebSocketModuleRunnerTransport
  if (content.includes('send(data) {      ws.send(JSON.stringify(data));    }')) {
    content = content.replace(
      'send(data) {      ws.send(JSON.stringify(data));    }',
      'send(data) {      if (ws && typeof ws.send === "function" && ws.readyState === 1) { try { ws.send(JSON.stringify(data)); } catch (e) {} }    }'
    );
    changed = true;
  } else if (content.includes('ws.send(JSON.stringify(data));')) {
    content = content.replace(
      'ws.send(JSON.stringify(data));',
      'if (ws && typeof ws.send === "function" && ws.readyState === 1) { try { ws.send(JSON.stringify(data)); } catch (e) {} }'
    );
    changed = true;
  }

  // Guard wsTransport.send
  if (content.includes('send(data) {        wsTransport.send(data);      }')) {
    content = content.replace(
      'send(data) {        wsTransport.send(data);      }',
      'send(data) {        try { wsTransport?.send?.(data); } catch (e) {}      }'
    );
    changed = true;
  }

  // Guard this.transport.send
  if (content.includes('this.transport.send(payload).catch((err) => {      this.logger.error(err);    });')) {
    content = content.replace(
      'this.transport.send(payload).catch((err) => {      this.logger.error(err);    });',
      'try { const p = this.transport?.send?.(payload); if (p && typeof p.catch === "function") p.catch(() => {}); } catch (err) {}'
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(targetFile, content, 'utf-8');
    console.log('[patch-vite-client] Successfully patched Vite client for sandbox environment.');
  } else {
    console.log('[patch-vite-client] Already patched or pattern not found.');
  }
}
