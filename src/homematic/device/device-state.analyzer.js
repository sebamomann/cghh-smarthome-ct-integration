class DeviceStateAnalyzer {

    currentState;
    updatedState;

    constructor(currentState, newState) {
        this.currentState = currentState;
        this.updatedState = newState;
    }

    /**
     * @returns {boolean}
     */
    channelsAreIdentical(channelIndex) {
        const compareAttributes = ["temperature", "setTemperature", "valvePosition"];

        const currentChannel = this.currentState.channels.find(channel => channel.index = channelIndex);
        const updatedChannel = this.updatedState.channels.find(channel => channel.index = channelIndex);

        for (const attribute of compareAttributes) {
            if (!currentChannel) return false;

            if (currentChannel[attribute] !== updatedChannel[attribute]) {
                return false;
            }
        };

        return true;
    }

    /**
     * @returns {boolean}
     */
    didSetChannelTemperatureChange(channelIndex) {
        const currentChannel = this.currentState.channels.find(channel => channel.index = channelIndex);
        const updatedChannel = this.updatedState.channels.find(channel => channel.index = channelIndex);

        if (!currentChannel) return false;

        return currentChannel.setTemperature !== updatedChannel.setTemperature;
    }

}

module.exports = { DeviceStateAnalyzer };