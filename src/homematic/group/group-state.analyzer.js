class GroupStateAnlyzer {

    currentState;
    updatedState;

    constructor(currentState, newState) {
        this.currentState = currentState;
        this.updatedState = newState;
    }

    /**
     * @returns {boolean}
     */
    statesAreIdentical() {
        const compareAttributes = ["temperature", "setTemperature", "humidity"];

        compareAttributes.forEach((attribute) => {
            if (this.currentState[attribute] !== this.updatedState[attribute]) {
                return false;
            }
        });

        return true;
    }

    /**
     * @returns {boolean}
     */
    didSetTemperatureChange() {
        return this.currentState.setTemperature === this.updatedState.setTemperature;
    }

}

module.exports = { GroupStateAnlyzer };