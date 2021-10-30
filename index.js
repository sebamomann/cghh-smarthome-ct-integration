const { startEventListener } = require('./websocket');
const { execute } = require("./cron-job");

const CronJob = require('cron').CronJob;

require('dotenv').config();

/**
 * ENTRYPOINT
 */
const job = new CronJob(process.env.CRON_DEFINITION, () => execute());
job.start();

execute();
startEventListener();
