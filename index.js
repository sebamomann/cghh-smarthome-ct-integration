const { execute } = require("./src/churchtools/churchtools-event-cron");
const { startEventListener } = require("./src/homematic/homematic-event-listener");

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

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

execute();
startEventListener();

const pingUptime = (message) => {
    var xmlHttp = new XMLHttpRequest();
    let url = process.env.UPTIME_KUMA_URL + "?msg=" + message + "&ping=";
    xmlHttp.open("GET", url, false); // false for synchronous request
    xmlHttp.send(null);
};
