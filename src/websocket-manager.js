const axios = require('axios');
const WebSocket = require('ws');
const { Uptime } = require('../uptime');

class WebsocketManager {
    websocket;
    pingIntervallMilliseconds = 10 * 1000; // 5s
    reconnectIntervallMillis = 10 * 1000; // 10s

    pingIntervalRef;
    reconnectIntervalRef;

    // connection information
    url;
    headers;

    constructor(url) {
        this.url = url;
    }

    setHeaders(headers) {
        this.headers = headers;
    }

    /**
     * Start websocket connection
     * Set default callback on message
     * 
     * @param {*} callback  Callback to execute on message event
     */
    connect = async (callback) => {
        await this.checkServerUrl();
        this.websocket = new WebSocket(this.url, {
            headers: this.headers
        });

        this.websocket.on('message', (data) => {
            Uptime.pingUptime("up", "GOT MESSAGE", "WS");
            callback(data);
        });

        this.websocket.on('open', () => {
            console.log("[WS] Connected");
            Uptime.pingUptime("up", "CONNECTED", "WS");
            this.initializePingInterval();
        });

        this.websocket.on('close', async () => {
            console.log('[WS] Disconnected');
            Uptime.pingUptime("down", "DISCONNECTED", "WS");
            this.clearPingInterval();
            this.initializeReconnectInterval(callback);
        });

        this.websocket.on('error', (error) => {
            console.log('[WS] [Error] ' + error.message);
            Uptime.pingUptime("down", error.message, "WS");
            this.clearPingInterval();
            this.initializeReconnectInterval(callback);
        });

        this.websocket.on('unexpected-response', (error) => {
            console.log('[WS] [Error] ' + error.message);
            Uptime.pingUptime("down", error.message, "WS");
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
                    if (this.websocket.readyState > 0) {
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
            this.connect(callback);
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

    async checkServerUrl() {
        const payload = {
            "clientCharacteristics": {
                "apiVersion": "10",
                "applicationIdentifier": "homematicip-python",
                "applicationVersion": "1.0",
                "deviceManufacturer": "none",
                "deviceType": "Computer",
                "language": "de-DE",
                "osType": "Windows",
                "osVersion": "10"
            },
            "id": process.env.HOMEMATIC_ACCESS_POINT_ID
        };

        const headers = {};

        const url = "https://lookup.homematic.com:48335/getHost";

        var response;
        try {
            response = await axios.post(url, payload, { headers });
            console.log("[INFO] [WS] [URL] [OLD] " + this.url);
            this.url = response.data["urlWebSocket"];
            console.log("[INFO] [WS] [URL] [NEW] " + this.url);
        } catch (e) {
            console.log("[ERROR] [API CALL] [HOMEMATIC LOOKUP] Could not execute API request");
            console.log("[ERROR] [API CALL] [HOMEMATIC LOOKUP] Reson: " + e);
            console.log("[ERROR] [API CALL] [HOMEMATIC LOOKUP] Payload: " + JSON.stringify(payload));
            console.log("[ERROR] [API CALL] [HOMEMATIC LOOKUP] " + JSON.stringify(e.response.data));

            throw Error(e);
        }
    }
}

module.exports = { WebsocketManager };
