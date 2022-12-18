const { InfluxDB } = require('@influxdata/influxdb-client');
const { Point } = require('@influxdata/influxdb-client');
const { GroupState } = require('./../homematic/group/group-state');
const moment = require('moment-timezone');
moment.tz.setDefault("Europe/Berlin");

class InfluxDBManager {
    org = process.env.INFLUX_ORG;

    influx;

    constructor() {
        this.influx = new InfluxDB({
            url: "http://" + process.env.INFLUX_HOST + ":" + process.env.INFLUX_PORT,
            token: process.env.INFLUX_TOKEN
        });
    }

    /**
     * @param {GroupState} currentState 
     * @param {GroupState} updatedState
     * @param {GroupState} automatic
     */
    async sendGroupLog(currentState, updatedState, automatic, eventName) {
        const writeApi = this.influx.getWriteApi(this.org, "logs");
        writeApi.useDefaultTags({});

        const point = new Point("Temperature manipulation");
        point.stringField("log", `Changed setTemperature from ${currentState.setTemperature} to ${updatedState.setTemperature}`);
        point.tags = {
            group: currentState.label.replace(/\s/g, ""),
            type: (automatic ? "AUTO" : "MANU"),
            event: (automatic ? eventName.replace(/\s/g, "") : "")
        };
        writeApi.writePoint(point);

        try {
            await writeApi.close();
        } catch (e) {
            console.log("[INFLUX] [ERROR] " + e);
        }
    }

    async sendLog(data, info = {}) {
        const writeApi = this.influx.getWriteApi(this.org, "logs");
        writeApi.useDefaultTags(data.tags ? data.tags : {});

        const point = new Point("Default Log");
        point.stringField("log", data.message);
        if (Object.keys(info).length > 0) {
            point.stringField("info", JSON.stringify(info));
        }
        writeApi.writePoint(point);

        try {
            await writeApi.close();
        } catch (e) {
            console.log("[INFLUX] [ERROR] " + e);
        }
    }

    async sendGenericInformation(data, bucket) {
        const writeApi = this.influx.getWriteApi(this.org, bucket);

        writeApi.useDefaultTags(data.tags ? data.tags : {});

        const point = new Point(data.label);

        const dataValues = data.values;
        const dataValueKeys = Object.keys(dataValues);

        dataValueKeys
            .forEach(
                dataValueKey => {
                    const value = dataValues[dataValueKey];
                    if (value !== undefined && value !== null) {
                        point.floatField(dataValueKey, dataValues[dataValueKey]);
                    }
                }
            );

        writeApi.writePoint(point);

        try {
            await writeApi.close();
        } catch (e) {
            console.log("[INFLUX] [ERROR] " + e);
        }
    }
}

module.exports = { InfluxDBManager };