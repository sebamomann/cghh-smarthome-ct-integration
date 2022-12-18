const moment = require('moment-timezone');
const { InfluxDBManager } = require('../influx/influx-db');
moment.tz.setDefault("Europe/Berlin");

class Logger {

    static core(data, info = {}) {
        Logger.log("CORE", data.tags, data.message, info);
    }

    static trace(data, info = {}) {
        Logger.log("TRACE", data.tags, data.message, info);
    }

    static debug(data, info = {}) {
        Logger.log("DEBUG", data.tags, data.message, info);
    }

    static info(data, info = {}) {
        Logger.log("INFO", data.tags, data.message, info);
    }

    static warning(data, info = {}) {
        Logger.log("WARN", data.tags, data.message, info);
    }

    static error(data, info = {}) {
        Logger.log("ERROR", data.tags, data.message, info);
    }

    static log(level, tags, message, info = {}) {
        tags ? tags : {};
        tags["level"] = level;

        console.log(`[${moment().format("YYYY-MM-DD HH:mm:ss")}] [${tags.level}] ${JSON.stringify(tags)} ${message}`);

        const influxDb = new InfluxDBManager();
        tags = { level, ...tags };
        influxDb.sendLog({ tags, message }, info);
    }
}

module.exports = { Logger };