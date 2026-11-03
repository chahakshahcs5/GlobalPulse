import { loadEnv } from '../../../libs/shared/src/env';

/**
 * Load the repository `.env` before any module reads `process.env`.
 * Imported for its side effect as the first import in `main.ts`.
 */
loadEnv();
