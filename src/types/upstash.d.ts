// Type declarations for optional dependencies
declare module '@upstash/redis' {
    export class Redis {
        constructor(config: { url: string; token: string });
        ping(): Promise<string>;
        get(key: string): Promise<unknown>;
        setex(key: string, ttl: number, value: unknown): Promise<string>;
        del(key: string): Promise<number>;
    }
}
