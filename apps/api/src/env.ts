import dotenv from 'dotenv';

/**
 * The API's environment.
 *
 * This module exists so that the environment is loaded before anything else
 * runs. A module that reads `process.env` while it is being imported — a
 * queue that works out its Redis address, a database client that looks for
 * its connection string — would otherwise see an empty environment, because
 * the imports are evaluated before the statement that loads the file.
 *
 * Importing this module first is what makes the order right.
 */
dotenv.config();
