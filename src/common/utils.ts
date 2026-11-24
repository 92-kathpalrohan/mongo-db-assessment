export function buildMongoUri(
    mongodb: {
        host: string;
        username: string;
        password: string;
        database: string;
    },
    { isLocal }: { isLocal: boolean },
): string {
    if (isLocal) {
        // Atlas Local runs as a one-node replica set; directConnection stops
        // the driver from trying to reach the container's internal hostname.
        return `mongodb://${mongodb.host}/${mongodb.database}?directConnection=true`;
    }
    return `mongodb+srv://${mongodb.username}:${mongodb.password}@${mongodb.host}/${mongodb.database}?retryWrites=true&w=majority`;
}

// Escapes user text so it's matched literally inside a regex.
export function escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
