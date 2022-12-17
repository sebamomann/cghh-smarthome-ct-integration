const axios = require('axios');
const { Logger } = require('./src/util/logger');

class Uptime {
    static pingUptime = (status, message, subject) => {
        let url = `${subject == "CRON" ? process.env.UPTIME_KUMA_CRON_URL : process.env.UPTIME_KUMA_WS_URL}?status=${status}&msg=${message}&ping=`;

        var tags = { module: "HEALTH", function: "UPTIME", status, subject };
        axios.get(url)
            .then((response) => {
                Logger.debug({ tags, message: "Ping sent to uptime" });
            })
            .catch((err) => {
                Logger.error({ tags, message: "Could not send status to Uptime: " + err });
            });
    };
}

module.exports = { Uptime };