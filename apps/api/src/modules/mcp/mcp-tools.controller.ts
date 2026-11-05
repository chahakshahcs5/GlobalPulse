import { Controller, Get, Headers, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { NestAuthGuard, RequireScope } from '../../common/auth.guard';

interface McpToolDescriptor {
  name: string;
  description?: string;
  inputSchema?: { properties?: Record<string, unknown> };
}

function parseRpcBody(text: string): Record<string, unknown> {
  const dataLine = text.split(/\r?\n/).find((line) => line.startsWith('data: '));
  return JSON.parse(dataLine ? dataLine.slice('data: '.length) : text) as Record<string, unknown>;
}

/**
 * Proxies the live MCP `tools/list` catalog to the admin UI.
 *
 * The browser cannot speak Streamable HTTP/JSON-RPC directly, and the MCP
 * server requires the caller's bearer token. Forward that token and perform
 * the initialize → initialized → tools/list handshake here.
 */
@Controller('api/mcp')
@UseGuards(NestAuthGuard)
export class McpToolsController {
  @Get('tools')
  @RequireScope('news:read')
  async listTools(@Headers('authorization') authorization?: string) {
    const base = process.env.MCP_BASE_URL || 'http://localhost:4001/mcp';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...(authorization ? { Authorization: authorization } : {}),
    };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const initResponse = await fetch(base, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'globalpulse-admin', version: '1.0.0' },
          },
        }),
      });
      const sessionId = initResponse.headers.get('mcp-session-id');
      await initResponse.text();

      const sessionHeaders = sessionId ? { ...headers, 'Mcp-Session-Id': sessionId } : headers;

      if (sessionId) {
        await fetch(base, {
          method: 'POST',
          headers: sessionHeaders,
          signal: controller.signal,
          body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }),
        })
          .then((response) => response.text())
          .catch(() => undefined);
      }

      const listResponse = await fetch(base, {
        method: 'POST',
        headers: sessionHeaders,
        signal: controller.signal,
        body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }),
      });
      const text = await listResponse.text();
      const parsed = parseRpcBody(text) as {
        result?: { tools?: McpToolDescriptor[] };
        error?: { message?: string };
      };

      if (parsed.error) {
        throw new ServiceUnavailableException(parsed.error.message || 'MCP catalog unavailable');
      }

      return {
        tools: (parsed.result?.tools || []).map((tool) => ({
          name: tool.name,
          description: tool.description || '',
          parameters: Object.keys(tool.inputSchema?.properties || {}),
        })),
      };
    } catch (err) {
      if (err instanceof ServiceUnavailableException) throw err;
      throw new ServiceUnavailableException(
        `MCP server is unreachable: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
