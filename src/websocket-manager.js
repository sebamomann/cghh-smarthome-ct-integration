const axios = require('axios');
const WebSocket = require('ws');
const { Uptime } = require('../uptime');
const { Logger } = require('./util/logger');

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
        var tags = { module: "WS" };

        await this.checkServerUrl();
        this.websocket = new WebSocket(this.url, {
            headers: this.headers
        });

        this.websocket.on('message', (data) => {
            Uptime.pingUptime("up", "GOT MESSAGE", "WS");
            callback(data);
        });

        this.websocket.on('open', () => {
            Logger.info({ tags, message: "Connected" });
            Uptime.pingUptime("up", "CONNECTED", "WS");
            this.initializePingInterval();
        });

        this.websocket.on('close', async () => {
            Logger.warning({ tags, message: "Disconnected" });
            Uptime.pingUptime("down", "DISCONNECTED", "WS");
            this.clearPingInterval();
            this.initializeReconnectInterval(callback);
        });

        this.websocket.on('error', (error) => {
            Logger.warning({ tags, message: error.message });
            Uptime.pingUptime("down", error.message, "WS");
            this.clearPingInterval();
            this.initializeReconnectInterval(callback);
        });

        this.websocket.on('unexpected-response', (error) => {
            Logger.warning({ tags, message: error.message });
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

    checkServerUrl = async () => {
        var tags = { module: "API", function: "HOMEMATIC_LOOKUP" };
        Logger.debug({ tags, message: "Fetching Server URL for Homematic API" });

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
            const oldUrl = process.env.HOMEMATIC_API_URL;
            const newUrl = response.data["urlREST"] + "/";
            if (oldUrl !== newUrl) {
                Logger.warning({ tags, message: "Old URL: " + oldUrl });
                Logger.warning({ tags, message: "New URL: " + newUrl });
                process.env.HOMEMATIC_API_URL = newUrl;
            }

            const oldUrlWs = process.env.HOMEMATIC_WS_URL;
            const newUrlWs = response.data["urlWebSocket"] + "/";
            if (oldUrlWs !== newUrlWs) {
                Logger.warning({ tags, message: "Old URL WS: " + oldUrlWs });
                Logger.warning({ tags, message: "New URL WS: " + newUrlWs });
                process.env.HOMEMATIC_WS_URL = newUrlWs;
            }
        } catch (e) {
            tags = { ...tags, path: "/getHost" };
            const info = { request: payload, response: e.response?.data };
            Logger.error({ tags, message: "Could not execute API request: " + e }, info);

            throw Error(e);
        }
    };
}

module.exports = { WebsocketManager };
