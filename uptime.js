const axios = require('axios');

class Uptime {
    static pingUptime = (status, message, subject) => {
        console.log(`[HEALTH] [${subject}] Sending ping to Uptime`);
        let url = `${subject == "CRON" ? process.env.UPTIME_KUMA_CRON_URL : process.env.UPTIME_KUMA_WS_URL}?status=${status}&msg=${message}&ping=`;
        axios.get(url)
            .then((response) => {
                console.log(`[HEALTH] [${subject}] Ping sent to Uptime`);
            })
            .catch((err) => {
                console.log(`[HEALTH] [${subject}] [ERROR] Could not send ping to Uptime`);
                console.log(`[HEALTH] [${subject}] [ERROR] ${err}`);
            });
    };
}

module.exports = { Uptime };