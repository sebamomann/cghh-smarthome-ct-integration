const fs = require("fs");

const FILE_NAME = __dirname + "/states/devices.json";

class DeviceState {

    id;
    label;

    /**
     * @type {{temperature: number, setTemperature: number, valvePosition: number, index: number}[]}
     */
    channels;

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
            channels: this.channels
        };

        json_data[this.id] = data;

        fs.writeFileSync(FILE_NAME, JSON.stringify(json_data, null, 2), { encoding: 'utf8', flag: "w" });
    }
}

module.exports = { DeviceState };