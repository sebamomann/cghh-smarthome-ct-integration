const fs = require("fs");

const FILE_NAME = __dirname + "/states/groups.json";

class GroupState {

    id;
    label;

    temperature;
    setTemperature;
    humidity;

    /**
     * @type {expiring: string, eventName: string}
     */
    lock;

    constructor() { }

    save() {
        var dataRaw;
        try {
            dataRaw = fs.readFileSync(FILE_NAME, 'utf8');
        } catch (e) {
            dataRaw = {};
        }
        const json_data = JSON.parse(dataRaw);

        const data = {
            id: this.id,
            label: this.label,
            temperature: this.temperature,
            setTemperature: this.setTemperature,
            humidity: this.humidity,
            lock: this.lock
        };

        json_data[this.id] = data;

        fs.writeFileSync(FILE_NAME, JSON.stringify(json_data, null, 2), 'utf8');
    }
}

module.exports = { GroupState };