const fs = require("fs");
const fse = require("fs-extra");

const { HomematicApi } = require("../homematic-api");
const { RoomConfigurationFetcher } = require("../room/room-config.fetcher");

const moment = require('moment-timezone');
const { Console } = require("console");
const { EventLogger } = require("../../util/event.logger");
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
        const roomConfigurationFetcher = new RoomConfigurationFetcher();
        const roomConfiguration = roomConfigurationFetcher.getRoomConfigurationByHomematicId(this.id);
        const desiredTemperature = roomConfiguration.desiredTemperatureIdle;

        const api = new HomematicApi();
        await api.setTemperatureForGroup(this.id, desiredTemperature);

        EventLogger.resolveLock(this.label, desiredTemperature, lock);

        this.lock = null;
        this.save();
    }

    async heatGroupForEvent(event) {
        const roomConfigurationFetcher = new RoomConfigurationFetcher();
        const roomConfiguration = roomConfigurationFetcher.getRoomConfigurationByHomematicId(this.id);
        const desiredTemperature = roomConfiguration.getDesiredRoomTemepratureForEvent(event);

        if (this.setTemperature !== roomConfiguration.desiredTemperatureIdle) {
            EventLogger.groupUpdatePreheatBlocked(event.bezeichnung, this.label)
            return false;
        }

        const api = new HomematicApi();
        await api.setTemperatureForGroup(this.id, desiredTemperature);

        this.lock = {
            eventName: event.bezeichnung,
            expiring: moment(event.enddate)
        };

        EventLogger.groupUpdatePreheat(this.label, desiredTemperature, event)

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