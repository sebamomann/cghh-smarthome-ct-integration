const { Lock } = require("./lock");

const fs = require("fs");
const fse = require("fs-extra");
const { Logger } = require("../../util/logger");

const FILE_NAME = process.cwd() + "/persistent/locks.json";

class LockDB {

    constructor() {

    }

    /**
     * @param   {string} hmip_groupId 
     * @returns {Lock}
     */
    getByGroupId(hmip_groupId) {
        const json_data = this.getFileContent();
        var tags = { module: "LockDB", function: "getByGroupId", group: hmip_groupId };
        Logger.trace({ tags, message: "LockDB State: " + JSON.stringify(json_data) });

        const lockRaw = json_data[hmip_groupId];

        if (!lockRaw) throw new Error("Lock not found");

        const lock = new Lock();
        Object.assign(lock, lockRaw);

        return lock;
    }

    /**
     * @param {Lock} lock 
     */
    save(lock) {
        const json_data = this.getFileContent();

        const data = {
            groupId: lock.groupId,
            expiring: lock.expiring,
            eventName: lock.eventName,
        };

        json_data[lock.groupId] = data;

        fse.outputFileSync(FILE_NAME, JSON.stringify(json_data, null, 2));
    }

    /**
     * @param {Lock} lock
     */
    delete(lock) {
        const json_data = this.getFileContent();
        delete json_data[lock.groupId];

        fse.outputFileSync(FILE_NAME, JSON.stringify(json_data, null, 2));
    }

    getFileContent() {
        var dataRaw;

        try {
            dataRaw = fs.readFileSync(FILE_NAME, 'utf8');
        } catch (e) {
            dataRaw = "{}";
        }

        try {
            return JSON.parse(dataRaw);
        } catch (e) {
            return {};
        }
    }
}

module.exports = { LockDB };