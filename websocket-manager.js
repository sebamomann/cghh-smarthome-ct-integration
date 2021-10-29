const WebSocket = require('ws');

require("dotenv").config();

class WebsocketManager {
    api;

    websocket;
    pingIntervallMilliseconds = 10 * 1000; // 5s
    reconnectIntervallMillis = 10 * 1000; // 10s

    pingIntervalRef;
    reconnectIntervalRef;

    constructor() {
    }

    /**
     * Start websocket connection
     * Set default callback on message
     * 
     * @param {*} callback  Callback to execute on message event
     */
    connect = (callback) => {
        this.websocket = new WebSocket(process.env.HOMEMATIC_WS_URL, {
            headers: {
                'AUTHTOKEN': process.env.HOMEMATIC_API_AUTHTOKEN,
                'CLIENTAUTH': process.env.HOMEMATIC_API_CLIENTAUTH,
            },
        });

        this.websocket.on('message', callback);

        this.websocket.on('open', () => {
            console.log("[WS] Connected");
            this.initializePingInterval();
        });

        this.websocket.on('close', () => {
            console.log('[WS] Disconnected');
            this.clearPingInterval();
            this.initializeReconnectInterval(callback);
        });

        this.websocket.on('error', (error) => {
            console.log('[WS] [Error] ' + error.message);
            this.clearPingInterval();
            this.initializeReconnectInterval(callback);
        });

        this.websocket.on('unexpected-response', (error) => {
            console.log('[WS] [Error] ' + error.message);
            this.clearPingInterval();
            this.initializeReconnectInterval(callback);
        });
    };

    /**
     * Set new ping interval.
     * Interval causes use of connection every {@link pingIntervallMilliseconds} milliseconds.
     * Always check if connection is still valid.
     */
    initializePingInterval = () => {
        this.clearPingInterval();

        if (this.websocket) {
            this.pingIntervalRef = setInterval(
                () => {
                    if (this.websocket) {
                        this.websocket.ping();
                    }
                }, this.pingIntervallMilliseconds);
        }
    };

    /**
     * Set new reconect interval.
     * Interval causes reconnect to server every {@link reconnectIntervallMillis} milliseconds, if the connection broke down for some reason.
     * Always check if connection is still valid.
     */
    initializeReconnectInterval = (callback) => {
        this.clearWsReconnectInterval();

        this.reconnectIntervalRef = setInterval(() => {
            this.connectWs(callback);
        }, this.reconnectIntervallMillis);
    };

    /**
     * Clear current ping interval if exists
     */
    clearPingInterval = () => {
        if (this.pingIntervalRef) {
            clearInterval(this.pingIntervalRef);
        }
    };

    /**
     * Clear current reconnect interval if exists
     */
    clearWsReconnectInterval = () => {
        if (this.reconnectIntervalRef) {
            clearInterval(this.reconnectIntervalRef);
        }
    };
}

module.exports = { WebsocketManager };
