const { DeviceState } = require("./device-state");
const { Device } = require("./homematic/device/device");

const FILE_NAME = __dirname + "/states/devices.js";

class DeviceStateBuilder {
    constructor() {

    }

    deviceStateFromFile(deviceId) {
        var dataRaw;
        try {
            dataRaw = fs.readFileSync(FILE_NAME, 'utf8');
        } catch (e) {
            dataRaw = {};
        }

        const json_data = JSON.parse(dataRaw);

        const deviceStateRaw = json_data.find(device => device.id === deviceId);

        if (!deviceStateRaw) {
            return this.buildInitDeviceState();
        }

        const deviceState = new GroupState();
        Object.assign(deviceState, deviceStateRaw);

        return deviceState;
    }

    /**
     * 
     * @param {Device} device 
     * @returns 
     */
    deviceStateFromGroup(device) {
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
                        setTemperature: channel.setTemperature
                    };

                    channels.push(outputChannel);
                }
            );

        deviceState.channels = channels;

        return groupState;
    }

    /**
     * @param {GroupState} state 
     */
    deviceStateFromGroupState(state) {
        return JSON.parse(JSON.stringify(state));
    }

    buildInitDeviceState() {
        const deviceState = new DeviceState();

        deviceState.label = "INIT";

        return deviceState;
    }
}

module.exports = { DeviceStateBuilder };