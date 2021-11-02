class DeviceState {

    id;
    label;

    /**
     * @type {{temperature: number, setTemperature: number, valvePosition: number, index: number}[]}
     */
    channels;

    constructor() { }
}

module.exports = { DeviceState };