declare module 'ws' {
    import { EventEmitter } from 'events';
    import { Duplex } from 'stream';

    export type RawData = string | Buffer | ArrayBuffer | Buffer[];

    export interface WebSocketServerOptions {
        server: import('http').Server;
        path?: string;
    }

    export class WebSocket extends Duplex {
        static readonly OPEN: number;
        readyState: number;
        send(data: string | Buffer): void;
        close(code?: number, data?: string | Buffer): void;
        on(event: 'message', listener: (data: RawData) => void): this;
        on(event: 'close', listener: () => void): this;
        on(event: 'error', listener: (err: Error) => void): this;
    }

    export class WebSocketServer extends EventEmitter {
        clients: Set<WebSocket>;
        constructor(options?: WebSocketServerOptions);
        on(event: 'connection', listener: (socket: WebSocket, request: import('http').IncomingMessage) => void): this;
        on(event: 'close', listener: () => void): this;
    }
}

