import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket, RawData } from 'ws';
import { PROGRESS_EVENT, JobProgressMessage, progressEmitter } from './progressEmitter';

interface ClientState {
    subscriptions: Set<string> | null;
}

let isInitialized = false;

const toJsonString = (data: Record<string, unknown>): string => JSON.stringify(data);

const normalizeMessage = (raw: RawData): string => {
    if (typeof raw === 'string') {
        return raw;
    }

    if (Buffer.isBuffer(raw)) {
        return raw.toString('utf8');
    }

    if (Array.isArray(raw)) {
        return Buffer.concat(raw).toString('utf8');
    }

    return Buffer.from(raw as ArrayBuffer).toString('utf8');
};

const sendJson = (socket: WebSocket, payload: Record<string, unknown>): void => {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(toJsonString(payload));
    }
};

const shouldDispatch = (state: ClientState, update: JobProgressMessage): boolean => {
    if (!update.progressId) {
        return true;
    }

    if (!state.subscriptions || state.subscriptions.size === 0) {
        return true;
    }

    return state.subscriptions.has(update.progressId);
};

const handleMessage = (socket: WebSocket, state: ClientState, raw: RawData): void => {
    const message = normalizeMessage(raw);

    try {
        const data = JSON.parse(message);

        if (data?.type === 'subscribe' && typeof data.progressId === 'string') {
            const progressId = data.progressId.trim();
            if (!state.subscriptions) {
                state.subscriptions = new Set();
            }
            state.subscriptions.add(progressId);
            sendJson(socket, { type: 'subscribed', progressId });
        } else if (data?.type === 'unsubscribe' && typeof data.progressId === 'string') {
            const progressId = data.progressId.trim();
            if (state.subscriptions?.has(progressId)) {
                state.subscriptions.delete(progressId);
            }
            sendJson(socket, { type: 'unsubscribed', progressId });
        } else if (data?.type === 'subscribeAll') {
            state.subscriptions = null;
            sendJson(socket, { type: 'subscribed_all' });
        } else if (data?.type === 'ping') {
            sendJson(socket, { type: 'pong', timestamp: new Date().toISOString() });
        } else {
            sendJson(socket, { type: 'error', message: 'Unrecognized message type' });
        }
    } catch (error) {
        console.error('Failed to handle websocket message', error);
        sendJson(socket, { type: 'error', message: 'Invalid JSON payload' });
    }
};

export const initializeWebSocketServer = (server: HTTPServer): void => {
    if (isInitialized) {
        return;
    }
    isInitialized = true;

    const clients = new Map<WebSocket, ClientState>();
    const wss = new WebSocketServer({ server, path: '/ws/progress' });

    const onProgress = (update: JobProgressMessage): void => {
        const serialized = toJsonString({ type: 'progress', ...update });
        for (const [client, state] of clients.entries()) {
            if (client.readyState !== WebSocket.OPEN) {
                clients.delete(client);
                continue;
            }

            if (!shouldDispatch(state, update)) {
                continue;
            }

            client.send(serialized);
        }
    };

    progressEmitter.on(PROGRESS_EVENT, onProgress);

    wss.on('connection', (socket) => {
        const state: ClientState = { subscriptions: null };
        clients.set(socket, state);

        sendJson(socket, {
            type: 'welcome',
            message: 'Connected to the Job Match AI progress stream.'
        });

        socket.on('message', (raw) => handleMessage(socket, state, raw));

        socket.on('close', () => {
            clients.delete(socket);
        });

        socket.on('error', (error) => {
            clients.delete(socket);
            console.error('Websocket socket error', error);
        });
    });

    wss.on('close', () => {
        progressEmitter.off(PROGRESS_EVENT, onProgress);
        clients.clear();
    });
};

