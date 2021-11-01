var fs = require('fs');

class EventTemperatureMapper {
    static FILE_NAME = "./churchtools/event-root.temperature.config.json";

    constructor() {
    }

    static getDesiredTemperatureForEvent(eventName) {
        var dataRaw;
        try {
            dataRaw = fs.readFileSync(FILE_NAME, 'utf8');
        } catch (e) {
            dataRaw = {};
        }
        const mappings = JSON.parse(dataRaw);

        const mappingKeys = Object.keys(mappings);

        mappingKeys.forEach(key => {
            if (eventName.toLowerCase().includes(key.toLowerCase())) {
                return mappings[key].desiredTemperature;
            }
        });

        return undefined;
    }
}

module.exports = { EventTemperatureMapper };