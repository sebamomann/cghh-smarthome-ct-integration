const fs = require("fs");
const fse = require("fs-extra");
const { GroupState } = require("./group-state");

const FILE_NAME = process.cwd() + "/persistent/states/groups.json";

class GroupStateDB {

    constructor() {

    }

    getById(hmip_groupId) {
        const json_data = this.getFileContent();
        const groupStateRaw = json_data[hmip_groupId];

        if (!groupStateRaw) throw new Error("Group state not found");

        const groupState = new GroupState();
        Object.assign(groupState, groupStateRaw);

        return groupState;
    }

    /**
     * @param {GroupState} state 
     */
    save = (state) => {
        const json_data = this.getFileContent();

        const data = {
            id: state.id,
            label: state.label,
            temperature: state.temperature,
            setTemperature: state.setTemperature,
            humidity: state.humidity,
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

module.exports = { GroupStateDB };