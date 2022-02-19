const axios = require("axios");

require('dotenv').config();

class HomematicApi {
    API_URL = process.env.HOMEMATIC_API_URL;
    ACCES_POINT_ID = process.env.HOMEMATIC_ACCESS_POINT_ID;
    AUTHTOKEN = process.env.HOMEMATIC_API_AUTHTOKEN;
    CLIENTAUTH = process.env.HOMEMATIC_API_CLIENTAUTH;

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
        return await this.callRest("group/heating/setSetPointTemperature", {
            "groupId": groupId,
            "setPointTemperature": desiredTemperature
        });
    }

    async callRest(path, payload) {
        const headers = {
            "content-type": "application/json",
            "accept": "application/json",
            "version": "12",
            "authtoken": this.AUTHTOKEN,
            "clientauth": this.CLIENTAUTH,
        };

        const url = this.API_URL + "hmip/" + path;

        var response;
        try {
            response = await axios.post(url, payload, { headers });
            return response.data;
        } catch (e) {
            console.log("[ERROR] [API CALL] [HOMEMATIC] Could not execute API request");
            console.log("[ERROR] [API CALL] [HOMEMATIC] Reson: " + e);
            console.log("[ERROR] [API CALL] [HOMEMATIC] Payload: " + payload);
            console.log("[ERROR] [API CALL] [HOMEMATIC] " + response.data);

            throw Error(e);
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