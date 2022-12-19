const moment = require('moment-timezone');
const { InfluxDBManager } = require('../influx/influx-db');
const { PendingLogsManager } = require('../pending-logs.manager');
const { Logger } = require('./logger');
moment.tz.setDefault("Europe/Berlin");

class EventLogger {

    /**
     * @param {string} minutes 
     */
    static heatingTimeExpectancy(minutes, minpreOfBooking) {
        console.log(`[${this.t()}] [CRON] [ROOM UPDATE] [+] Preheating takes ~ ${Math.round(minutes)} minutes (incl. ${minpreOfBooking} min booking offset)`);
    }

    static resolveLock(groupState, desiredTemperature, lock) {
        const tags = { module: "CRON", function: "EXECUTE", group: groupState.label.replace(/ /g, '_') };
        const message = `[-] ${groupState.label} to ${desiredTemperature} for ${lock.eventName} ending at ${this.ft(lock.expiring)}`;
        Logger.core({ tags, message });
    }

    static groupUpdatePreheat(roomName, desiredTemperature, event) {
        const tags = { module: "CRON", function: "EXECUTE", group: roomName.replace(/ /g, '_') };
        const message = `[+] ${roomName} to ${desiredTemperature} for ${event.bezeichnung} ending at ${this.ft(event.startdate)}`;
        Logger.core({ tags, message });
    }

    static groupUpdatePreheatBlocked(eventName, roomName) {
        const tags = { module: "CRON", function: "EXECUTE", group: roomName.replace(/ /g, '_') };
        const message = `[#] ${roomName} preheating is blocked for event ${eventName} due to current manual override`;
        Logger.core({ tags, message });
    }

    /**
     * @param {GroupState} currentState 
     * @param {GroupState} updatedState 
     */
    static groupUpdateEvent(currentState, updatedState) {
        const isInitialUpdate = currentState.label === "INIT";
        if (!isInitialUpdate) {
            this.groupUpdateEventString("PRE", currentState);
        }

        const fromTo = isInitialUpdate ? "INIT" : "POST";
        this.groupUpdateEventString(fromTo, updatedState);
    }

    static groupUpdateEventString(fromTo, groupState) {
        var message = groupState.label;

        if (groupState.setTemperature) message += ` - SetTemp: ${groupState.setTemperature.toFixed(1)}`;
        if (groupState.temperature) message += ` - CurrTemp: ${groupState.temperature.toFixed(1)}`;
        if (groupState.humidity) message += ` - Humidity: ${groupState.humidity.toFixed(1)}`;

        const tags = { module: "WS", function: "GROUP_UPDATE", group: groupState.label.replace(/ /g, '_'), snapshot: fromTo };
        Logger.debug({ tags, message });
    }

    static deviceUpdateEvent(currentState, updatedState, channelIndex) {
        const currentChannel = currentState.channels.find(channel => channel.index = channelIndex);
        const updatedChannel = updatedState.channels.find(channel => channel.index = channelIndex);

        const isInitialUpdate = currentState.label === "INIT";
        if (!isInitialUpdate) {
            this.deviceUpdateEventString("PRE", currentState, currentChannel);
        }

        const fromTo = isInitialUpdate ? "INIT" : "POST";
        this.deviceUpdateEventString(fromTo, updatedState, updatedChannel);
    }

    static deviceUpdateEventString(fromTo, deviceState, channel) {
        var message = deviceState.label;

        if (channel.setTemperature) message += ` - SetTemp: ${channel.setTemperature.toFixed(1)}`;
        if (channel.temperature) message += ` - CurrTemp: ${channel.temperature.toFixed(1)}`;
        if (channel.valvePosition) message += ` - ValvePos: ${channel.valvePosition.toFixed(1)}`;
        if (channel.index) message += ` - Index: ${channel.index}`;

        const tags = { module: "WS", function: "DEVICE_UPDATE", device: deviceState.label.replace(/ /g, '_'), snapshot: fromTo, channel: channel.index };
        Logger.debug({ tags, message });
    }

    static weatherUpdateEvent(currentState, updatedState) {
        const isInitialUpdate = currentState.label === "INIT";
        if (!isInitialUpdate) {
            this.weatherUpdateEventString("PRE", currentState);
        }

        const fromTo = isInitialUpdate ? "INIT" : "POST";
        this.weatherUpdateEventString(fromTo, updatedState);
    }

    static weatherUpdateEventString(fromTo, state) {
        var message = `${state.label} CurrTemp: ${state.temperature.toFixed(1)}`;
        message += ` - MinTemp: ${state.minTemperature.toFixed(1)}`;
        message += ` - MaxTemp: ${state.maxTemperature.toFixed(1)}`;
        message += ` - Humidity: ${state.humidity.toFixed(1)}`;
        message += ` - WindSpeed: ${state.windSpeed.toFixed(4)}`;
        message += ` - VaporAmount: ${state.vaporAmount.toFixed(4)}`;
        message += ` - WeatherCond: ${state.weatherCondition}`;
        message += ` - Time: ${state.weatherDayTime}`;

        const tags = { module: "WS", function: "WEATHER_UPDATE", location: state.label.replace(/ /g, '_'), snapshot: fromTo };
        Logger.debug({ tags, message });

    }

    static groupUpdateEventToInflux(currentState, updatedState) {
        if (currentState.setTemperature !== updatedState.setTemperature) {
            const pendingLogsManager = new PendingLogsManager();

            const pendigObj = pendingLogsManager.getPendingObjectByGroupId(currentState.id);
            const isPending = pendigObj?.pending;

            var tags = {
                module: "WS",
                function: "GROUP_UPDATE",
                group: currentState.label.replace(/\s/g, ""),
                type: (isPending ? "AUTO" : "MANU"),
            };

            if (isPending) {
                tags = { ...tags, event: pendigObj.eventName.replace(/\s/g, "") };
            }
            const message = `${currentState.label} - Changed setTemperature from ${currentState.setTemperature} to ${updatedState.setTemperature}`;
            Logger.core({ tags, message });

            // resolve pendig log
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