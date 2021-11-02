const { Lock } = require("./lock");

const fs = require("fs");
const fse = require("fs-extra");

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

        return JSON.parse(dataRaw);
    }
}

module.exports = { LockDB };