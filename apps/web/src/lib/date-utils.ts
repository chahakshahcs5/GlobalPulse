/**
 * Date formatting helpers.
 *
 * The implementation now lives in `@ai-news/blocks-ui` so the Block Studio
 * and the newsroom site format dates identically. This module is kept as the
 * app-local import path.
 */
export {
  formatLocalDate,
  formatLocalDateTime,
  formatLocalTime,
  formatDeterministicDate,
  formatDeterministicDateTime,
} from '@ai-news/blocks-ui';
