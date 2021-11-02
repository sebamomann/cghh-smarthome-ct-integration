const { EventTemperatureMapper } = require("../../util/event-temperature.mapper");

class RoomConfiguration {

    id;
    name;
    heatingForEvent;
    heatingOffset;
    heatingOffsetIdle;
    homematicName;
    homematicId;
    desiredTemperature;
    desiredTemperatureIdle;
    heatingRate;
    spinupTime;

    constructor() {
    }

    // TODO auslagern
    populateFields(roomRaw) {
        this.id = roomRaw.id;
        this.name = roomRaw.name;
        this.heatingForEvent = roomRaw.heatingForEvent;
        this.heatingOffset = roomRaw.heatingOffset;
        this.heatingOffsetIdle = roomRaw.heatingOffsetIdle;
        this.homematicName = roomRaw.homematicName;
        this.homematicId = roomRaw.homematicId;
        this.desiredTemperature = roomRaw.desiredTemperature;
        this.desiredTemperatureIdle = roomRaw.desiredTemperatureIdle;
        this.heatingRate = roomRaw.heatingRate;
        this.spinupTime = roomRaw.spinupTime;
    }

    /**
     * Calculate the aprox. minutes to heat the room. 
     * Calculated by taking the current temperature and room heating rate into account.
     * 
     * @param {*} event 
     */
    getMinutesNeededToReachTemperatureForEvent(event, groupState) {
        const desiredTemperature = this.getDesiredRoomTemepratureForEvent(event);
        const currentRoomTemperature = groupState.temperature;

        if (!currentRoomTemperature) return 120; // fallback if no current temperature entry is present

        const spinupTime = this.spinupTime;
        const minutesPerDegree = this.heatingRate;
        const degreeDifference = desiredTemperature - currentRoomTemperature;

        if (degreeDifference < 0) return 0; // no heating needed

        return spinupTime + (degreeDifference * minutesPerDegree);
    }

    /**
     * Get the desired temperature for this room in regards to a specific event.
     * Some events require different temperatures than the default desired temperature for the particular room. 
     * 
     * @param {*} event 
     */
    getDesiredRoomTemepratureForEvent(event) {
        var temperature = EventTemperatureMapper.getDesiredTemperatureForEvent(event.bezeichnung);

        if (!temperature) {
            temperature = this.desiredTemperature;
        }

        return temperature;
    }
};

module.exports = { RoomConfiguration };