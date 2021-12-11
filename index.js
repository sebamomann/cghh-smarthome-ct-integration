const { execute } = require("./src/churchtools/churchtools-event-cron");
const { startEventListener } = require("./src/homematic/homematic-event-listener");

const axios = require('axios');

const CronJob = require('cron').CronJob;

require('dotenv').config();

/**
 * ENTRYPOINT
 */
const job = new CronJob(process.env.CRON_DEFINITION, async () => {
    try {
        await execute();
        pingUptime("OK");
    } catch (e) {
        console.log(e);
    }
});

job.start();

pingUptime("OK");
execute();
startEventListener();

const pingUptime = (message) => {
    let url = process.env.UPTIME_KUMA_URL + "?msg=" + message + "&ping=";
    axios.get(url)
        .then((response) => {
            console.log("Heartbeat send to Uptime");
        })
        .catch((err) => {
            console.log(err);
        });
};
