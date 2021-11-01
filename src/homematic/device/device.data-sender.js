const { DeviceState } = require("./device-state");
const { DeviceStateAnalyzer } = require("./device-state.analyzer");
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
     * @param {DeviceState} currentState 
     * @param {DeviceState} updatedState
     */
    async sendChannelData(currentState, updatedState, channelIndex) {
        const deviceStateAnalyzer = new DeviceStateAnalyzer(currentState, updatedState);
        const didSetChannelTemperatureChange = deviceStateAnalyzer.didSetChannelTemperatureChange(channelIndex);

        const currentChannel = currentState.channels.find(channel => channel.index = channelIndex);
        const updatedChannel = updatedState.channels.find(channel => channel.index = channelIndex);

        if (didSetChannelTemperatureChange) {
            const resendChannel = Object.assign({}, updatedChannel);

            resendChannel.setTemperature = currentChannel.setTemperature;

            const resendDeviceStateInflux = parseDeviceStateChannelIntoInfluxDataObject(updatedState, resendChannel);
            await this.influxDB.sendGenericInformation(resendDeviceStateInflux, "device-heating-thermostat");
        }

        const newStateInflux = parseDeviceStateChannelIntoInfluxDataObject(updatedState, updatedChannel);
        await this.influxDB.sendGenericInformation(newStateInflux, "device-heating-thermostat");
    }
}

module.exports = { DeviceDataSender };