const { GroupState } = require("./group-state");

class GroupStateBuilder {
    constructor() {

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