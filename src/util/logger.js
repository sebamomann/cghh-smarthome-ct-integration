class Logger {

    static core(data) {
        Logger.log("CORE", data.tags, data.message);
    }

    static trace(data) {
        Logger.log("TRACE", data.tags, data.message);
    }

    static debug(data) {
        Logger.log("DEBUG", data.tags, data.message);
    }

    static info(data) {
        Logger.log("INFO", data.tags, data.message);
    }

    static warning(data) {
        Logger.log("WARN", data.tags, data.message);
    }

    static error(data) {
        Logger.log("ERROR", data.tags, data.message);
    }

    static log(level, tags, message) {
        tags ? tags : {};
        tags["level"] = level;

        console.log(`[${moment().format("YYYY-MM-DD HH:mm:ss")}] [${tags.level}] ${JSON.stringify(data.tags)} ${data.message}`);

        const influxDb = new InfluxDBManager();
        tags = { level, ...tags };
        influxDb.sendLog({ tags, message });
    }
}

module.exports = { Logger };