const { execute } = require("./src/churchtools/churchtools-event-cron");
const { startEventListener } = require("./src/homematic/homematic-event-listener");

const CronJob = require('cron').CronJob;

require('dotenv').config();

/**
 * ENTRYPOINT
 */
const job = new CronJob(process.env.CRON_DEFINITION, () => execute());
job.start();

execute();
startEventListener();
