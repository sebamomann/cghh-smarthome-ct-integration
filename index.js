const { execute, resetEverythingIfNotLocked } = require("./src/churchtools/churchtools-event-cron");
const { startEventListener } = require("./src/homematic/homematic-event-listener");

const moment = require('moment-timezone');
moment.tz.setDefault("Europe/Berlin");

const axios = require('axios');

const CronJob = require('cron').CronJob;

require('dotenv').config();

/**
 * ENTRYPOINT
 */
const job = new CronJob(process.env.CRON_DEFINITION, async () => {
    try {
        await checkServerUrl();
        await execute();
        pingUptime("OK");

        if (moment().hours() === 0 && moment().minutes() === 0) {
            resetEverythingIfNotLocked();
        }
    } catch (e) {
        console.log(e);
    }
});

job.start();

const pingUptime = (message) => {
    console.log("[CRON] Sending Heartbeat");
    let url = process.env.UPTIME_KUMA_URL + "?msg=" + message + "&ping=";
    axios.get(url)
        .then((response) => {
            console.log("[CRON] Heartbeat sent to Uptime");
        })
        .catch((err) => {
            console.log(err);
        });
};

const checkServerUrl = async () => {
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
        console.log("[INFO] [API] [URL] [OLD] " + process.env.HOMEMATIC_API_URL);
        process.env.HOMEMATIC_API_URL = response.data["urlREST"];
        console.log("[INFO] [API] [URL] [NEW] " + process.env.HOMEMATIC_API_URL);
    } catch (e) {
        console.log("[ERROR] [API CALL] [HOMEMATIC LOOKUP] Could not execute API request");
        console.log("[ERROR] [API CALL] [HOMEMATIC LOOKUP] Reson: " + e);
        console.log("[ERROR] [API CALL] [HOMEMATIC LOOKUP] Payload: " + JSON.stringify(payload));
        console.log("[ERROR] [API CALL] [HOMEMATIC LOOKUP] " + JSON.stringify(e.response.data));

        throw Error(e);
    }
};

const run = async () => {
    pingUptime("OK");
    await checkServerUrl();
    execute();
    startEventListener();
};

run();
