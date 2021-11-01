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

    getRelevantFunctionalChannels() {
        const functionalChannels = this.data.functionalChannels;
        const functionalChannelKeys = Object.keys(functionalChannels);

        var channels = [];

        for (let index = 0; index < functionalChannelKeys.length; index++) {
            const key = functionalChannelKeys[index];
            const channel = functionalChannels[key];

            if (channel.functionalChannelType !== "HEATING_THERMOSTAT_CHANNEL") continue;

            channels.push(channel);
        };

        return channels;
    }
}

module.exports = { Device };