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

export function mcpErrorResponse(error: string) {
  return {
    isError: true,
    content: [
      {
        type: 'text' as const,
        text: typeof error === 'string' ? error : JSON.stringify(error),
      },
    ],
  };
}

export const successResponse = mcpJsonResponse;
export const errorResponse = mcpErrorResponse;
