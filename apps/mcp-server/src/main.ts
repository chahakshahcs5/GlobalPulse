import dotenv from 'dotenv';
import { createMcpApp } from './server';

dotenv.config();

const port = parseInt(process.env.MCP_PORT || '4001', 10);
const host = process.env.MCP_HOST || '0.0.0.0';

async function start() {
  const { httpServer } = createMcpApp();
  httpServer.listen(port, host, () => {
    console.log(`🔌 Remote MCP Server listening on http://${host}:${port}/mcp`);
    console.log(`OAuth Protected Resource: http://${host}:${port}/.well-known/oauth-protected-resource`);
    console.log(`Health check: http://${host}:${port}/health`);
  });
}

start();
