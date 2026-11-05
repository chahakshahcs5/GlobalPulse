import { request } from './core';

export interface McpToolSummary {
  name: string;
  description: string;
  parameters: string[];
}

export async function listMcpTools(): Promise<McpToolSummary[]> {
  const result = await request<{ tools: McpToolSummary[] }>('/api/mcp/tools');
  return result.tools || [];
}
