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

        compareAttributes.forEach((attribute) => {
            if (this.currentState[channelIndex][attribute] !== this.updatedState[channelIndex][attribute]) {
                return false;
            }
        });

        return true;
    }

    /**
     * @returns {boolean}
     */
    didSetChannelTemperatureChange(channelIndex) {
        return this.currentState[channelIndex].setTemperature === this.updatedState[channelIndex].setTemperature;
    }

}

module.exports = { DeviceStateAnalyzer };