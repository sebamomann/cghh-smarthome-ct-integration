const { DeviceState } = require("./device-state");
const { Device } = require("./device");

const fs = require("fs");

const FILE_NAME = process.cwd() + "/persistent/states/devices.json";

class DeviceStateBuilder {
    constructor() {

    }

    deviceStateFromFile(deviceId) {
        var dataRaw;

        try {
            dataRaw = fs.readFileSync(FILE_NAME, 'utf8');
        } catch (e) {
            dataRaw = "{}";
        }

        const json_data = JSON.parse(dataRaw);

        const deviceStateRaw = json_data[deviceId];

        if (!deviceStateRaw) {
            return this.buildInitDeviceState();
        }

        const deviceState = new DeviceState();
        Object.assign(deviceState, deviceStateRaw);

        return deviceState;
    }

    /**
     * 
     * @param {Device} device 
     * @returns 
     */
    deviceStateFromHomematicDevice(device) {
        const deviceState = new DeviceState();

        deviceState.id = device.data.id;
        deviceState.label = device.data.label;

        const channels = [];

        device
            .getRelevantFunctionalChannels()
            .forEach(
                (channel) => {
                    const outputChannel = {
                        index: channel.index,
                        valvePosition: channel.valvePosition,
                        temperature: channel.valveActualTemperature,
                        setTemperature: channel.setPointTemperature
                    };

                    channels.push(outputChannel);
                }
            );

        deviceState.channels = channels;

        return deviceState;
    }

    /**
     * @param {DeviceState} state 
     */
    deviceStateFromDeviceState(state) {
        return JSON.parse(JSON.stringify(state));
    }

    buildInitDeviceState() {
        const deviceState = new DeviceState();

        deviceState.label = "INIT";
        deviceState.channels = [];

        return deviceState;
    }
}

module.exports = { DeviceStateBuilder };