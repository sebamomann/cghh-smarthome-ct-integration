const { GroupState } = require("./group-state");

const FILE_NAME = __dirname + "/states/groups.js";

class GroupStateBuilder {
    constructor() {

    }

    groupStateFromFile(groupId) {
        var dataRaw;
        try {
            dataRaw = fs.readFileSync(FILE_NAME, 'utf8');
            console.log(dataRaw);
        } catch (e) {
            dataRaw = {};
        }
        const json_data = JSON.parse(dataRaw);

        const groupStateRaw = json_data.find(group => group.id === groupId);

        if (!groupStateRaw) {
            return this.buildInitGroupState();
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

    buildInitGroupState() {
        const groupState = new GroupState();

        groupState.label = "INIT";

        return groupState;
    }
}

module.exports = { GroupStateBuilder };