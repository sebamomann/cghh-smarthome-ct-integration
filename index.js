const { execute, resetEverythingIfNotLocked } = require("./src/churchtools/churchtools-event-cron");
const { startEventListener } = require("./src/homematic/homematic-event-listener");
const { Uptime } = require("./uptime");

const moment = require('moment-timezone');
moment.tz.setDefault("Europe/Berlin");

const axios = require('axios');
const { InfluxDBManager } = require("./src/influx/influx-db");

const CronJob = require('cron').CronJob;

require('dotenv').config();

/**
 * ENTRYPOINT
 */
const job = new CronJob(process.env.CRON_DEFINITION, async () => { executeCron(); });

const executeCron = async () => {
    var count = 0;
    var maxTries = 3;
    var resetNotPossible = {};

    while (count < maxTries) {
        try {
            await execute();

            // try reset if failed ealryer
            // or its 0 o'clock
            if (moment().hours() === 0 && moment().minutes() === 0 || Object.keys(resetNotPossible).length > 0) {
                resetNotPossible = resetEverythingIfNotLocked(resetNotPossible);
                if (Object.keys(resetNotPossible).length > 0) {
                    throw new Error("Cant reset " + Object.keys(resetNotPossible).length + " elements");
                }
            }

            console.log("[CRON] Success");

            Uptime.pingUptime("up", "OK", "CRON");
            return;
        } catch (e) {
            await checkServerUrl();
            count++;
        }
    }

    Uptime.pingUptime("down", e, "CRON");
};

job.start();

// AUSLAGERN
const checkServerUrl = async () => {
    const influxDb = new InfluxDBManager();

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
        influxDb.sendLog({ tags: { status: "INFO", module: "API", function: "HOMEMATIC LOOKUP" }, message: "Old URL: " + process.env.HOMEMATIC_API_URL });
        process.env.HOMEMATIC_API_URL = response.data["urlREST"];
        influxDb.sendLog({ tags: { status: "INFO", module: "API", function: "HOMEMATIC LOOKUP" }, message: "New URL: " + process.env.HOMEMATIC_API_URL });
    } catch (e) {
        const tags = { status: "ERROR", module: "API", function: "HOMEMATIC LOOKUP", path: "/getHost" };
        influxDb.sendLog({ tags, message: "Could not execute API request" });
        influxDb.sendLog({ tags, message: "Reason: " + e });
        influxDb.sendLog({ tags, message: "Payload: " + JSON.stringify(payload) });
        influxDb.sendLog({ tags, message: JSON.stringify(e.response?.data) });

        throw Error(e);
    }
};

const run = async () => {
    executeCron();
    startEventListener();
};

run();
