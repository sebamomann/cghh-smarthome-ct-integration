const fs = require("fs");
const fse = require("fs-extra");

const FILE_NAME = process.cwd() + "/persistent/pendingLogs.json";

class PendingLogsManager {

    constructor() {

    }

    /**
     * @param {String} groupId
     */
    isPendingForGroupId = (groupId) => {
        const json_data = this.getFileContent();
        return json_data[groupId] === true;
    };

    /**
     * @param {String} groupId
     */
    setPendingForGroupId = (groupId, pending) => {
        const json_data = this.getFileContent();
        json_data[groupId] = pending;
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