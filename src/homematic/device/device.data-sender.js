const { DeviceState } = require("./device-state");
const { DeviceStateAnlyzer } = require("./device-state.analyzer");
const { parseDeviceStateChannelIntoInfluxDataObject } = require("../../util/homematic-influx.mapper");
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
     * @param {DeviceState} currentData 
     * @param {DeviceState} updatedData
     */
    async sendChannelData(currentData, updatedData, channelIndex) {
        const deviceStateAnalyzer = new DeviceStateAnlyzer(currentState, newState);
        const didSetChannelTemperatureChange = deviceStateAnalyzer.didSetChannelTemperatureChange(channelIndex);

        if (didSetChannelTemperatureChange) {
            const resendChannel = updatedData[channelIndex];

            resendChannel.setTemperature = currentData.channels[channelIndex].setTemperature;

            console.log("RESEND");
            const resendDeviceStateInflux = parseDeviceStateChannelIntoInfluxDataObject(updatedData, channel);
            await this.influxDB.sendGenericInformation(resendDeviceStateInflux, "device-heating-thermostat");
            console.log(resendDeviceStateInflux);
        }

        console.log("SEND");
        const newStateInflux = parseDeviceStateChannelIntoInfluxDataObject(updatedData, updatedData.channels[channelIndex]);
        await this.influxDB.sendGenericInformation(newStateInflux, "device-heating-thermostat");
        console.log(newStateInflux);
    }
}

module.exports = { DeviceDataSender };