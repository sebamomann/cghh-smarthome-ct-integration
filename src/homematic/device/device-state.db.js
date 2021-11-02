const fs = require("fs");
const fse = require("fs-extra");

const FILE_NAME = process.cwd() + "/persistent/states/devices.json";

class DeviceStateDB {

    constructor() {

    }

    /**
     * @param {DeviceState} state 
     */
    save = (state) => {
        const json_data = this.getFileContent();

        const data = {
            id: state.id,
            label: state.label,
            channels: state.channels
        };

        json_data[state.id] = data;

        fse.outputFileSync(FILE_NAME, JSON.stringify(json_data, null, 2));
    };

    getFileContent = () => {
        var dataRaw;

        try {
            dataRaw = fs.readFileSync(FILE_NAME, 'utf8');
        } catch (e) {
            dataRaw = "{}";
        }

        return JSON.parse(dataRaw);
    };
}

module.exports = { DeviceStateDB };