const axios = require("axios");
const { InfluxDBManager } = require("../influx/influx-db");
const { Logger } = require("../util/logger");

require('dotenv').config();

class HomematicApi {
    API_URL = process.env.HOMEMATIC_API_URL;
    ACCES_POINT_ID = process.env.HOMEMATIC_ACCESS_POINT_ID;
    AUTHTOKEN = process.env.HOMEMATIC_API_AUTHTOKEN;
    CLIENTAUTH = process.env.HOMEMATIC_API_CLIENTAUTH;
    influxDb = new InfluxDBManager();

    constructor() {

    }

    async getCurrentHomeState() {
        return await this.callRest("home/getCurrentState", this.getCharacteristics());
    }

    /**
     * 
     * @param {string} groupId 
     * @param {number} desiredTemperature 
     * @returns 
     */
    async setTemperatureForGroup(groupId, desiredTemperature) {
        const tags = { module: "API", function: "HOMEMATIC", group: groupId };
        Logger.debug({ tags, message: `Set temperature of ${groupId} to ${desiredTemperature}` });
        return await this.callRest("group/heating/setSetPointTemperature", {
            "groupId": groupId,
            "setPointTemperature": desiredTemperature
        });
    }

    async callRest(path, payload, attempt = 1, id = null) {
        if (id == null) {
            let r = (Math.random() + 1).toString(36).substring(7);
            id = r;
        }

        const maxRetries = 5;
        const headers = {
            "content-type": "application/json",
            "accept": "application/json",
            "version": "12",
            "authtoken": this.AUTHTOKEN,
            "clientauth": this.CLIENTAUTH,
        };

        const url = this.API_URL + "hmip/" + path;

        var response;
        var tags = { module: "API", function: "HOMEMATIC", attempt, identifier: id, path: "/" + path };
        const info = { request: payload };

        try {
            response = await axios.post(url, payload, { headers });
            Logger.debug({ tags, message: "Api call succeeded" });

            return response.data;
        } catch (e) {
            tags = { ...tags };
            info.response = e.response?.data;

            if (attempt <= maxRetries) {
                const retryInMs = Math.pow(5000, attempt * 0.5);

                Logger.warning({ tags, message: "Could not execute API request: " + e }, info);
                Logger.warning({ tags, message: "Retrying in " + retryInMs + " ms" }, info);

                setTimeout(() => {
                    Logger.warning({ tags: { ...tags, attempt: attempt + 1 }, message: "Retrying request" }, info);
                    this.callRest(path, payload, attempt++);
                }, retryInMs);
            } else {
                Logger.error({ tags, message: "Could not execute API request: " + e }, info);
                throw Error(e);
            }
        }

    }

    getCharacteristics() {
        return {
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
            "id": this.ACCES_POINT_ID
        };
    }
}

module.exports = { HomematicApi };