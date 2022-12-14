const { currentTime } = require('@influxdata/influxdb-client');
const moment = require('moment-timezone');
const { InfluxDBManager } = require('../influx/influx-db');
const { PendingLogsManager } = require('../pending-logs.manager');
moment.tz.setDefault("Europe/Berlin");

class EventLogger {

    static startCron() {
        const influxDb = new InfluxDBManager();
        const tags = { level: "INFO", module: "CRON", function: "START" };
        influxDb.sendLog({ tags, message: "Starting Cronjob" });
    }

    /**
     * @param {string} minutes 
     */
    static heatingTimeExpectancy(minutes, minpreOfBooking) {
        console.log(`[${this.t()}] [CRON] [ROOM UPDATE] [+] Preheating takes ~ ${Math.round(minutes)} minutes (incl. ${minpreOfBooking} min booking offset)`);
    }

    static resolveLock(groupName, desiredTemperature, lock) {
        const values = [
            groupName,
            desiredTemperature,
            lock.eventName,
            this.ft(lock.expiring)
        ];

        console.log(`[${this.t()}] [CRON] [ROOM UPDATE] [-] %s to %d for %s ending at %s`, ...values);
    }

    static groupUpdatePreheat(roomName, desiredTemperature, event) {
        const values = [
            roomName,
            desiredTemperature,
            event.bezeichnung,
            event.startdate
        ];

        console.log(`[${this.t()}] [CRON] [ROOM UPDATE] [+] %s to %d for %s starting at %s`, ...values);
    }

    static groupUpdatePreheatBlocked(eventName, roomName) {
        const values = [
            roomName,
            eventName,
        ];

        console.log(`[${this.t()}] [CRON] [ROOM UPDATE] [#] %s preheating is blocked for event '%s' due to current manual override`, ...values);
    }

    /**
     * @param {GroupState} currentState 
     * @param {GroupState} updatedState 
     */
    static groupUpdateEvent(currentState, updatedState) {
        const isInitialUpdate = currentState.label === "INIT";
        if (!isInitialUpdate) {
            this.groupUpdateEventString("FROM", currentState);
        }

        const fromTo = isInitialUpdate ? "INIT" : "TOOO";
        this.groupUpdateEventString(fromTo, updatedState);
    }

    static groupUpdateEventString(fromTo, state) {
        var message = `[${this.t()}] [Event] [GRP UPDATE] [%s] %s`;

        const values = [
            fromTo,
            state.label
        ];

        if (state.setTemperature) message += ` - SetTemp: ${state.setTemperature.toFixed(1)}`;
        if (state.temperature) message += ` - CurrTemp: ${state.temperature.toFixed(1)}`;
        if (state.humidity) message += ` - Humidity: ${state.humidity.toFixed(1)}`;

        console.log(message, ...values);
    }

    static deviceUpdateEvent(currentState, updatedState, channelIndex) {
        const currentChannel = currentState.channels.find(channel => channel.index = channelIndex);
        const updatedChannel = updatedState.channels.find(channel => channel.index = channelIndex);

        const isInitialUpdate = currentState.label === "INIT";
        if (!isInitialUpdate) {
            this.deviceUpdateEventString("FROM", currentState, currentChannel);
        }

        const fromTo = isInitialUpdate ? "INIT" : "TOOO";
        this.deviceUpdateEventString(fromTo, updatedState, updatedChannel);
    }

    static deviceUpdateEventString(fromTo, state, channel) {
        var message = `[${this.t()}] [Event] [DVC UPDATE] [%s] %s`;

        const values = [
            fromTo,
            state.label
        ];

        if (channel.setTemperature) message += ` - SetTemp: ${channel.setTemperature.toFixed(1)}`;
        if (channel.temperature) message += ` - CurrTemp: ${channel.temperature.toFixed(1)}`;
        if (channel.valvePosition !== undefined && channel.valvePosition !== null) message += ` - ValvePos: ${channel.valvePosition.toFixed(1)}`;
        if (channel.index) message += ` - Index: ${channel.index}`;

        console.log(message, ...values);
    }

    static weatherUpdateEvent(currentState, updatedState) {
        const isInitialUpdate = currentState.label === "INIT";
        if (!isInitialUpdate) {
            this.weatherUpdateEventString("FROM", currentState);
        }

        const fromTo = isInitialUpdate ? "INIT" : "TOOO";
        this.weatherUpdateEventString(fromTo, updatedState);
    }

    static weatherUpdateEventString(fromTo, state) {
        const values = [
            fromTo,
            state.label,
            state.temperature.toFixed(1),
            state.minTemperature.toFixed(1),
            state.maxTemperature.toFixed(1),
            state.humidity.toFixed(1),
            state.windSpeed.toFixed(4),
            state.vaporAmount.toFixed(4),
            state.weatherCondition,
            state.weatherDayTime
        ];

        console.log(`[${this.t()}] [Event] [WTR UPDATE] [%s] %s CurrTemp: %d - MinTemp: %d - MaxTemp: %d - Humidity: %d - WindSpeed: %d - VaporAmount: %d - WeatherCond: %s - Time: %s`, ...values);
    }

    static groupUpdateEventToInflux(currentState, updatedState) {
        if (currentState.setTemperature !== updatedState.setTemperature) {
            const pendingLogsManager = new PendingLogsManager();
            const influxDB = new InfluxDBManager();

            const pendigObj = pendingLogsManager.getPendingObjectByGroupId(currentState.id);
            const isPending = pendigObj?.pending;

            influxDB.sendGroupLog(currentState, updatedState, isPending, pendigObj?.eventName);

            if (isPending) pendingLogsManager.setPendingForGroupId(currentState.id, false, null);
        }
    }

    static ft = (string) => {
        return moment(string).format("YYYY-MM-DD HH:mm:ss");
    };

    static t = () => {
        return moment().format("YYYY-MM-DD HH:mm:ss");
    };

}

module.exports = { EventLogger };