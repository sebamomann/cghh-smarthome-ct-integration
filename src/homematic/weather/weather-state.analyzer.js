class WeatherStateAnlyzer {

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
        const compareAttributes = ["temperature", "minTemperature", "maxTemperature", "humidity", "windSpeed", "vaporAmount", "weatherCondition", "weatherDayTime"];

        for (const attribute of compareAttributes) {
            if (this.currentState[attribute] !== this.updatedState[attribute]) {
                return false;
            }
        }

        return true;
    }
}

module.exports = { WeatherStateAnlyzer };