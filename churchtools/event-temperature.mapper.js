var fs = require('fs');

class EventTemperatureMapper {
    static FILE_NAME = "./churchtools/event-temperature.mapping.json";

    constructor() {
    }

    static getTemperatureForEvent(eventName) {
        const data = fs.readFileSync(this.FILE_NAME, 'utf8');
        const mappings = JSON.parse(data);

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