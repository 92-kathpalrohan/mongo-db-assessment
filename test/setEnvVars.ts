// Runs before any test file, so config.ts sees these values. A .env file, if
// present, doesn't override variables that are already set.
process.env.NODE_ENV = 'local';
process.env.MONGODB__HOST = process.env.MONGODB__HOST ?? 'localhost:27017';
// Never the real database: tests create and drop their own data.
process.env.MONGODB__DATABASE = 'mdb_assess_test';
process.env.SERVICE__API_KEY = 'test-key';
