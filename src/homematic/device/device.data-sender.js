const { DeviceState } = require("./device-state");
const { DeviceStateAnalyzer } = require("./device-state.analyzer");
const { parseDeviceStateChannelIntoInfluxDataObject, parseDeviceStateChannelIntoInfluxDataObjectState } = require("../../util/homematic-influx.mapper");
const { InfluxDBManager } = require("../../influx/influx-db");

/**
 * TODO
 * Zusammenfassen? 
 * --> Vererbung?
 */
class DeviceDataSender {

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
     * @param {DeviceState} currentState 
     * @param {DeviceState} updatedState
     */
    async sendChannelData(currentState, updatedState, channelIndex) {
        const updatedChannel = updatedState.channels.find(channel => channel.index = channelIndex);

        const newStateInflux = parseDeviceStateChannelIntoInfluxDataObject(updatedState, updatedChannel);
        await this.influxDB.sendGenericInformation(newStateInflux, "devices");
        const newStateInfluxState = parseDeviceStateChannelIntoInfluxDataObjectState(updatedState, updatedChannel);
        await this.influxDB.sendGenericInformation(newStateInfluxState, "devices");
    }
}

module.exports = { DeviceDataSender };