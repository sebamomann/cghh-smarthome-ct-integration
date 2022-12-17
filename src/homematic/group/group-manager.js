const { PendingLogsManager } = require("../../pending-logs.manager");
const { Logger } = require("../../util/logger");
const { HomematicApi } = require("../homematic-api");
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
        await this.updateTemperature(desiredTemperature, eventName, true);
    }

    /**
     * @param {*} event 
     * @throws {Error} If room is currently heated (may happen if somebody changes temperature between events)
     */
    async heatForEvent(event) {
        const desiredTemperature = this.roomConfiguration.getDesiredRoomTemepratureForEvent(event);

        // check if temp is currently manually changed
        const temperatureIsManuallyChanged = this.roomState.setTemperature !== this.roomConfiguration.desiredTemperatureIdle;
        const currentTemperatureIsDefined = this.roomState.setTemperature !== undefined;
        if (temperatureIsManuallyChanged && currentTemperatureIsDefined) throw new Error("Blocked");

        await this.updateTemperature(desiredTemperature, event.bezeichnung, true);
    }

    async updateTemperature(desiredTemperature, eventName, isIdle = false) {
        // set before data send, otherwise websocket might trigger before lock is set
        const pendingLogsManager = new PendingLogsManager();
        pendingLogsManager.setPendingForGroupId(this.groupId, true, eventName);

        try {
            await this.homematicAPI.setTemperatureForGroup(this.groupId, desiredTemperature);

            Logger.debug({ tags, message: `Set temperature of ${groupId} to ${desiredTemperature}` });
        } catch (e) {
            Logger.error({ tags, message: `Can't set temperature of ${groupId} to ${desiredTemperature}: ${e}` });

            // revert pending
            pendingLogsManager.setPendingForGroupId(this.groupId, false, null);
            throw new Error("Cannot set Temperature to idle");
        }
    }

}

module.exports = { GroupManager };