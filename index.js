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
    Logger.info({ tags: generalTags, message: "======= Starting Cronjob =======" });

    var maxTries = 3;
    var resetNotPossible = {};

    // try reset if failed ealryer
    // or its 0 o'clock
    if (moment().hours() === 0 && moment().minutes() === 0 || Object.keys(resetNotPossible).length > 0) {
        for (var count = 1; count <= maxTries; count++) {
            var resetTags = { module: "CRON", function: "RESET", attempt: count };
            Logger.info({ tags: resetTags, message: "Starting nightly reset" });

            try {
                resetNotPossible = await resetEverythingIfNotLocked(resetNotPossible);

                if (Object.keys(resetNotPossible).length > 0) {
                    throw new Error(`Cant reset ${Object.keys(resetNotPossible).length} elements`); // gets catched directly
                }

                Logger.info({ tags: resetTags, message: "Finished nightly reset" });
                break;
            } catch (e) {
                if (count == maxTries) {
                    Logger.error({ tags: resetTags, message: e.message });
                    Uptime.pingUptime("down", e, "CRON");
                    break;
                } else {
                    Logger.warning({ tags: resetTags, message: e.message });
                }

                await checkServerUrl();
            }
        }
    }

    const tags = { module: "CRON", function: "EXECUTE" };
    try {
        await execute();
        Uptime.pingUptime("up", "OK", "CRON");
    } catch (e) {
        Logger.error({ tags, message: "Failed event handling: " + e });
        Uptime.pingUptime("down", e, "CRON");
    }
};

job.start();

// AUSLAGERN
const checkServerUrl = async () => {
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

const run = async () => {
    executeCron();
    startEventListener();
};

run();
