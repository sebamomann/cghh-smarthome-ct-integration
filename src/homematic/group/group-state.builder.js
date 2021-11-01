const { GroupState } = require("./group-state");

const fs = require("fs");

const FILE_NAME = process.cwd() + "/persistent/states/groups.json";

class GroupStateBuilder {
    constructor() {

    }

    /**
     * @param {string} hmipGroupId 
     * @returns {GroupState}
     */
    groupStateFromFile(hmipGroupId) {
        var dataRaw;

        try {
            dataRaw = fs.readFileSync(FILE_NAME, 'utf8');
        } catch (e) {
            dataRaw = "{}";
        }

        const json_data = JSON.parse(dataRaw);
        const groupStateRaw = json_data[hmipGroupId];

        if (!groupStateRaw) {
            return this.buildInitGroupState(hmipGroupId);
        }

        const groupState = new GroupState();
        Object.assign(groupState, groupStateRaw);

        return groupState;
    }

    groupStateFromHomematicGroup(group) {
        const groupState = new GroupState();

        groupState.id = group.data.id;
        groupState.label = group.data.label;

        groupState.temperature = group.data.actualTemperature;
        groupState.setTemperature = group.data.setPointTemperature;
        groupState.humidity = group.data.humidity;

        return groupState;
    }

    /**
     * @param {GroupState} state 
     */
    groupStateFromGroupState(state) {
        return JSON.parse(JSON.stringify(state));
    }

    buildInitGroupState(hmipGroupId) {
        const groupState = new GroupState();

        groupState.id = hmipGroupId;
        groupState.label = "INIT";

        return groupState;
    }
}

module.exports = { GroupStateBuilder };