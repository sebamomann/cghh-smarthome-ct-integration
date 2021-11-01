const fs = require("fs");
const fse = require("fs-extra");

const FILE_NAME = process.cwd() + "/persistent/states/devices.json";

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
            dataRaw = "{}";
        }

        const json_data = JSON.parse(dataRaw);

        const data = {
            id: this.id,
            label: this.label,
            channels: this.channels
        };

        json_data[this.id] = data;

        fse.outputFileSync(FILE_NAME, JSON.stringify(json_data, null, 2));
    }
}

module.exports = { DeviceState };