import { existsSync } from 'node:fs';

// .env is a local-dev convenience; in Docker and production the variables
// are already in process.env.
if (existsSync('.env')) {
    process.loadEnvFile();
}

const isLocal = process.env.NODE_ENV === 'local';

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function requireEnvNonLocal(name: string): string {
    if (isLocal) return process.env[name] || '';
    return requireEnv(name);
}

export const config = {
    isLocal,
    port: parseInt(process.env.PORT || '3000', 10),

    service: {
        apiKey: requireEnv('SERVICE__API_KEY'),
    },

    mongodb: {
        host: requireEnv('MONGODB__HOST'),
        username: requireEnvNonLocal('MONGODB__USERNAME'),
        password: requireEnvNonLocal('MONGODB__PASSWORD'),
        database: requireEnv('MONGODB__DATABASE'),
    },
};
