const { execute, resetEverythingIfNotLocked } = require("./src/churchtools/churchtools-event-cron");
const { startEventListener } = require("./src/homematic/homematic-event-listener");
const { Uptime } = require("./uptime");

const moment = require('moment-timezone');
moment.tz.setDefault("Europe/Berlin");

const axios = require('axios');
const { Logger } = require("./src/util/logger");

const CronJob = require('cron').CronJob;

require('dotenv').config();

/**
 * ENTRYPOINT
 */
const job = new CronJob(process.env.CRON_DEFINITION, async () => { executeCron(); });

const executeCron = async () => {
    const generalTags = { module: "CRON", function: "GENERAL" };
    Logger.info({ generalTags, message: "Starting Cronjob" });

    var count = 1;
    var maxTries = 3;
    var resetNotPossible = {};

    // try reset if failed ealryer
    // or its 0 o'clock
    if (moment().hours() === 0 && moment().minutes() === 0 || Object.keys(resetNotPossible).length > 0) {
        var resetTags = { module: "CRON", function: "RESET", count };
        Logger.info({ resetTags, message: "Starting nightly reset" });

        while (count <= maxTries) {
            try {
                resetNotPossible = await resetEverythingIfNotLocked(resetNotPossible);

                if (Object.keys(resetNotPossible).length > 0) {
                    throw new Error(`Cant reset ${Object.keys(resetNotPossible).length} elements`); // gets catched directly
                }

                Logger.info({ resetTags, message: "Finished nightly reset" });
            } catch (e) {
                if (count == maxTries) {
                    Logger.error({ resetTags, message: e.message });
                    Uptime.pingUptime("down", e, "CRON");
                    break;
                } else {
                    Logger.warn({ resetTags, message: e.message });
                }

                await checkServerUrl();
                count++;
            }
        }
    }

    const tags = { module: "CRON", function: "EXECUTE" };
    try {
        Logger.info({ tags, message: "Starting event handling" });
        await execute();
        Logger.info({ tags, message: "Finished event handling" });
        Uptime.pingUptime("up", "OK", "CRON");
    } catch (e) {
        Logger.error({ tags, message: "Failed event handling: " + e });
        Uptime.pingUptime("down", e, "CRON");
    }
};

job.start();

// AUSLAGERN
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
    var tags = { module: "API", function: "HOMEMATIC LOOKUP" };
    try {
        response = await axios.post(url, payload, { headers });
        Logger.warning({ tags, message: "Old URL: " + process.env.HOMEMATIC_API_URL });
        Logger.warning({ tags, message: "New URL: " + response.data["urlREST"] });
        process.env.HOMEMATIC_API_URL = response.data["urlREST"];
    } catch (e) {
        tags = { ...tags, path: "/getHost", request: JSON.stringify(payload), response: JSON.stringify(e.response?.data) };
        Logger.error({ tags, message: "Could not execute API request: " + e });

        throw Error(e);
    }
};

const run = async () => {
    executeCron();
    startEventListener();
};

run();
