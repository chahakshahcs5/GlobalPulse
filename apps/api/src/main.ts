import dotenv from 'dotenv';
import { buildServer } from './server';

dotenv.config();

const port = parseInt(process.env.PORT || '4000', 10);
const host = process.env.HOST || '0.0.0.0';

async function start() {
  const server = buildServer();
  try {
    await server.listen({ port, host });
    console.log(`🚀 AI-Operable News Platform API listening on http://${host}:${port}`);
    console.log(`Protected Resource Discovery: http://${host}:${port}/.well-known/oauth-protected-resource`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
