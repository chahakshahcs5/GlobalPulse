export function mcpTextResponse(text: string) {
  return {
    content: [
      {
        type: 'text' as const,
        text,
      },
    ],
  };
}

export function mcpJsonResponse(data: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}
