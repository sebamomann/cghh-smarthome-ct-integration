class Group {

    data;

    constructor(data) {
        this.data = data;
    }

    /**
     * Only groups with a wallthermostat or wall temperature/humidity sensor have an "actualTemperature" attribute
     * @returns boolean if actual temperature is set
     */
    containsThermostat() {
        return this.data.actualTemperature !== null;
    }

    /**
     * @returns boolean if is of type "HEATING"
     */
    isHeatingGroup() {
        return this.data.type === "HEATING";
    }
}

module.exports = { Group };