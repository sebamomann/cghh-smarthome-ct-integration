var fs = require('fs');
const { eventNames } = require('process');

const FILE_NAME = process.cwd() + "/config/event-room-temperature.config.json";

class EventTemperatureMapper {
    constructor() {
    }

    static getDesiredTemperatureForEvent(eventName) {
        var dataRaw;

        try {
            dataRaw = fs.readFileSync(FILE_NAME, 'utf8');
        } catch (e) {
            dataRaw = "{}";
        }

        const mappings = JSON.parse(dataRaw);

        for (const [key, value] of Object.entries(mappings)) {
            if (eventName.toLowerCase().includes(key.toLowerCase())) {
                console.log(value.desiredTemperature);
                return value.desiredTemperature;
            }
        }

        return undefined;
    }
}

module.exports = { EventTemperatureMapper };