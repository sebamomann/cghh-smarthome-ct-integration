const fs = require("fs");
const fse = require("fs-extra");

const { HomematicApi } = require("../homematic-api");
const { RoomConfigurationFetcher } = require("../room/room-config.fetcher");

const moment = require('moment-timezone');
const { Console } = require("console");
moment.tz.setDefault("Europe/Berlin");

const FILE_NAME = process.cwd() + "/persistent/states/groups.json";

class GroupState {

    id;
    label;

    temperature;
    setTemperature;
    humidity;

    /**
     * @type {expiring: string, eventName: string}
     */
    lock;

    constructor() { }

    groupIsLocked() {
        return this.lock !== undefined && this.lock !== null;
    }

    groupLockIsExpired() {
        const currentTime = moment();
        const expiryDate = moment(this.lock.expiring);

        return currentTime.isAfter(expiryDate);
    }

    async resolveLock() {
        const eventNameThatCausedLock = this.lock.eventName;

        const roomConfigurationFetcher = new RoomConfigurationFetcher();
        const roomConfiguration = roomConfigurationFetcher.getRoomConfigurationByHomematicId(this.id);
        const desiredTemperature = roomConfiguration.desiredTemperatureIdle;

        const api = new HomematicApi();
        await api.setTemperatureForGroup(this.id, desiredTemperature);

        console.log(`[${moment().format("YYYY-MM-DD HH:mm:ss")}] [CRON] [ROOM UPDATE] [-] ${this.label} to ${desiredTemperature} for ${eventNameThatCausedLock} ending at ${moment(this.lock.expiring).format("YYYY-MM-DD HH:mm:ss")}`);

        this.lock = null;

        this.save();
    }

    async heatGroupForEvent(event) {
        const roomConfigurationFetcher = new RoomConfigurationFetcher();
        const roomConfiguration = roomConfigurationFetcher.getRoomConfigurationByHomematicId(this.id);
        const desiredTemperature = roomConfiguration.getDesiredRoomTemepratureForEvent(event);

        if (this.setTemperature !== roomConfiguration.desiredTemperatureIdle) {
            console.log(`[${moment().format("YYYY-MM-DD HH:mm:ss")}] [CRON] [ROOM UPDATE] [+] ${event.bezeichnung} ${this.label} update blocked due to current manual override`);
            return false;
        }

        const api = new HomematicApi();
        await api.setTemperatureForGroup(this.id, desiredTemperature);

        this.lock = {
            eventName: event.bezeichnung,
            expiring: moment(event.enddate)
        };

        console.log(`[${moment().format("YYYY-MM-DD HH:mm:ss")}] [CRON] [ROOM UPDATE] [+] ${this.label} to ${desiredTemperature} for ${event.bezeichnung} starting at ${event.startdate}`);

        this.save();
        return true;
    }

    async save() {
        var dataRaw;

        try {
            dataRaw = fs.readFileSync(FILE_NAME, 'utf8');
        } catch (e) {
            dataRaw = "{}";
        }

        const json_data = JSON.parse(dataRaw);

        const data = {
            id: this.id,
            label: this.label,
            temperature: this.temperature,
            setTemperature: this.setTemperature,
            humidity: this.humidity,
            lock: this.lock
        };

        json_data[this.id] = data;

        fse.outputFileSync(FILE_NAME, JSON.stringify(json_data, null, 2));
    }
}

module.exports = { GroupState };