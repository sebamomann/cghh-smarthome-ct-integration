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

    async setToIdle(eventName) {
        const desiredTemperature = this.roomConfiguration.desiredTemperatureIdle;

        const pendingLogsManager = new PendingLogsManager();

        try {
            await this.homematicAPI.setTemperatureForGroup(this.groupId, desiredTemperature);

            pendingLogsManager.setPendingForGroupId(this.groupId, true, eventName);
        } catch (e) {
            console.log("[ERROR] [IDLE] Can't set temperature " + desiredTemperature + " for Group " + this.groupId + "");
            // console.log(e);

            // revert pending
            pendingLogsManager.setPendingForGroupId(this.groupId, false, null);
            throw new Error("Cannot set Temperature to idle");
        }
    }

    /**
     * @param {*} event 
     */
    async heatForEvent(event) {
        const desiredTemperature = this.roomConfiguration.getDesiredRoomTemepratureForEvent(event);

        if (this.roomState.setTemperature !== this.roomConfiguration.desiredTemperatureIdle && this.roomState.setTemperature !== undefined) throw new Error("Blocked");

        // set before data send, otherwise websocket might trigger before lock is set
        const pendingLogsManager = new PendingLogsManager();
        pendingLogsManager.setPendingForGroupId(this.groupId, true, event.bezeichnung);

        try {
            await this.homematicAPI.setTemperatureForGroup(this.groupId, desiredTemperature);
        } catch (e) {
            console.log("[ERROR] [HEATING] Can't set temperature " + desiredTemperature + " for Group " + this.groupId + "");
            console.log(e);

            // revert pending
            pendingLogsManager.setPendingForGroupId(this.groupId, false, null);
        }
    }

}

module.exports = { GroupManager };