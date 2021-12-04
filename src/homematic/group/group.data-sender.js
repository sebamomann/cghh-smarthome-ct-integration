const { currentTime } = require("@influxdata/influxdb-client");
const { GroupState } = require("./group-state");
const { GroupStateAnlyzer } = require("./group-state.analyzer");
const { GroupStateBuilder } = require("./group-state.builder");
const { parseGroupStateIntoInfluxDataObject } = require("../../util/homematic-influx.mapper");
const { InfluxDBManager } = require("../../influx/influx-db");

class GroupDataSender {

    influxDb;

    constructor() {
        this.influxDB = new InfluxDBManager();
    }

    /**
     * Send data to the specified influx database.
     * Before sending the updated data, check if the set temperature is changed.
     * If so, resend this set temperature before the new data. This causes a aprupt change in the db visualization of setTemperature.
     * Otherwise a slow rise in the setTemperature would be interpreted.
     * 
     * @param {GroupState} currentState
     * @param {GroupState} newState
     */
    async sendData(currentState, newState) {
        const newStateInflux = parseGroupStateIntoInfluxDataObject(newState);
        await this.influxDB.sendGenericInformation(newStateInflux, "groups");
    }
}

module.exports = { GroupDataSender };