import http from 'node:http';
import { Server } from 'socket.io';
import { connectDatabase } from './config/db.js';
import { corsOrigin, env } from './config/env.js';
import { createApp } from './app.js';
import { registerSocketServer } from './sockets/io.js';

async function bootstrap() {
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: corsOrigin,
      credentials: true
    }
  });

  registerSocketServer(io);

  server.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
