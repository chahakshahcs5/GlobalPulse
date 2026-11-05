/**
 * Provider-neutral outbound email.
 *
 * Deployments wire a transactional email provider through a small HTTP
 * webhook (`EMAIL_WEBHOOK_URL`). The payload is
 * `{ to, subject, htmlBody, textBody }`; a provider adapter answers 2xx on
 * success. When the variable is unset, callers must report "not configured"
 * instead of pretending a message was sent.
 */
export type EmailSender = (params: {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
}) => Promise<{ success: boolean; messageId?: string; error?: string }>;

export function createHttpEmailSender(): EmailSender | undefined {
  const url = process.env.EMAIL_WEBHOOK_URL;
  if (!url) return undefined;

  const token = process.env.EMAIL_WEBHOOK_TOKEN;

  return async (params) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(params),
        signal: controller.signal,
      });
      return {
        success: response.ok,
        messageId: response.headers.get('x-message-id') || undefined,
        error: response.ok ? undefined : `Email provider returned HTTP ${response.status}`,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    } finally {
      clearTimeout(timeout);
    }
  };
}
