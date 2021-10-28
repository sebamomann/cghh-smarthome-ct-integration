const { HomematicApi } = require("./homematic-api");

const WebSocket = require('ws');

require("dotenv").config();

class WSConnection {
    api;

    ws;
    isWsConnectionClosed = false;
    wsPingIntervalMillis = 5000; // 5s
    wsReconnectIntervalMillis = 10 * 1000; // 10s

    wsPingIntervalRef;
    wsReconnectIntervalRef;

    constructor() {
    }

    /**
     * Start websocket connection
     * 
     * @param {*} callback  Callback to execute on message retrieval
     */
    connect = (callback) => {
        this.ws = new WebSocket(process.env.HOMEMATIC_WS_URL, {
            headers: {
                'AUTHTOKEN': process.env.HOMEMATIC_API_AUTHTOKEN,
                'CLIENTAUTH': process.env.HOMEMATIC_API_CLIENTAUTH,
            },
        });

        this.ws.on('message', callback);

        this.ws.on('open', () => {
            console.log('[WS] Connected');

            this.resetPingInterval();
        });

        this.ws.on('close', () => {
            console.log('[WS] Disconnected');

            this.clearPingInterval();

            if (!this.wsClosed) {
                this.resetPingInterval(listener);
            }
        });

        this.ws.on('error', (error) => {
            console.log('[WS] [Error] ' + error.message);

            this.clearPingInterval();

            if (!this.wsClosed) {
                this.resetPingInterval(listener);
            }
        });

        this.ws.on('unexpected-response', (request, response) => {
            console.log('[WS] [Error] ' + response.statusMessage + ' (' + response.statusCode + ')');

            this.clearPingInterval();
            if (!this.wsClosed) {
                this.resetPingInterval(listener);
            }
        });
    };

    resetPingInterval = () => {
        this.clearWsReconnectInterval();

        if (this.ws) { // init check if ws is set
            this.wsPingIntervalRef = setInterval(() => {
                if (this.ws) { // only ping if is still null
                    this.ws.ping();
                }
            }, this.wsPingIntervalMillis);
        }
    };

    resetReconnectInterval = (listener) => {
        this.clearWsReconnectInterval();

        this.wsReconnectIntervalRef = setInterval(() => {
            this.connectWs(listener);
        }, this.wsReconnectIntervalMillis);
    };

    clearPingInterval = () => {
        if (this.wsPingIntervalRef) {
            clearInterval(this.wsPingIntervalRef);
        }
    };

    clearWsReconnectInterval = () => {
        if (this.wsReconnectIntervalRef) {
            clearInterval(this.wsReconnectIntervalRef);
        }
    };
}

module.exports = { WSConnection };
