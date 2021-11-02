const { PendingLogsManager } = require("../../pending-logs.manager");
const { HomematicApi } = require("../homematic-api");
const { RoomConfigurationDB } = require("../room/room-config.db");
const { GroupState } = require("./group-state");

class GroupManager {

    /** @type {String} */
    groupId;
    /** @type {RoomConfiguration} */
    roomConfiguration;
    /** @type {GroupState} */
    roomState;
    /** @type {HomematicApi} */
    homematicAPI;

    constructor(id, roomConfiguration, roomState) {
        this.groupId = id;

        this.roomConfiguration = roomConfiguration;
        this.roomState = roomState;

        this.homematicAPI = new HomematicApi();
    }

    async setToIdle() {
        const desiredTemperature = this.roomConfiguration.desiredTemperatureIdle;
        await this.homematicAPI.setTemperatureForGroup(this.groupId, desiredTemperature);

        const pendingLogsManager = new PendingLogsManager();
        pendingLogsManager.setPendingForGroupId(this.groupId, true);
    }

    /**
     * @param {*} event 
     */
    async heatForEvent(event) {
        const desiredTemperature = this.roomConfiguration.getDesiredRoomTemepratureForEvent(event);

        if (this.roomState.setTemperature !== this.roomConfiguration.desiredTemperatureIdle) throw new Error("Blocked");

        await this.homematicAPI.setTemperatureForGroup(this.groupId, desiredTemperature);

        const pendingLogsManager = new PendingLogsManager();
        pendingLogsManager.setPendingForGroupId(this.groupId, true);
    }

}

module.exports = { GroupManager };