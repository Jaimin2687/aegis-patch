/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  transform: {},                    // no babel — use Node's native ESM
  extensionsToTreatAsEsm: [],       // .js already ESM via "type": "module"
  testMatch: ['**/tests/**/*.test.js'],
};
