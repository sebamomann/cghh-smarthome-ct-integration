class Device {

    data;

    constructor(data) {
        this.data = data;
    }

    /**
     * @returns boolean if is of type "HEATING"
     */
    isHeatingThermostat() {
        return this.data.type === "HEATING_THERMOSTAT";
    }

    getRelevantFunctionalChannel() {
        const functionalChannels = this.data.functionalChannels;
        const functionalChannelKeys = Object.keys(functionalChannels);

        for (let index = 0; index < functionalChannelKeys.length; index++) {
            const key = functionalChannelKeys[index];
            const channel = functionalChannels[key];

            const deviceSetPointTemperature = channel.setPointTemperature;
            const deviceActualValveTemperature = channel.valveActualTemperature;

            if (!deviceActualValveTemperature || !deviceSetPointTemperature) continue;

            return channel;
        };
    }
}

module.exports = { Device };