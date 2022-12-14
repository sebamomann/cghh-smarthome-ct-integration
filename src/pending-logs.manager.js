const fs = require("fs");
const fse = require("fs-extra");

const FILE_NAME = process.cwd() + "/persistent/pendingLogs.json";

/**
 * Pending means, that a automatic change has been made
 * If websocket is triggered and pendigLog == true -> log as automatic change
 */
class PendingLogsManager {

    constructor() {

    }

    getPendingObjectByGroupId = (groupId) => {
        const json_data = this.getFileContent();
        return json_data[groupId];
    };

    /**
     * @param {String} groupId
     */
    isPendingForGroupId = (groupId) => {
        const json_data = this.getFileContent();
        return json_data[groupId].pending === true;
    };

    /**
     * @param {String} groupId
     */
    setPendingForGroupId = (groupId, pending, eventName) => {
        const json_data = this.getFileContent();
        json_data[groupId] = {
            pending: pending,
            eventName: eventName
        };
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

module.exports = { PendingLogsManager };