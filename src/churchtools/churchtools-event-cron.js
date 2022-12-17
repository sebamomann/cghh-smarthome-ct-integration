// classes
const { EventLogger } = require("../util/event.logger");
const { RoomConfigurationDB } = require('../homematic/room/room-config.db');
// functions
const { getEvents } = require("./events");
// elements
const { filterEventsThatDidNotStartYetOrAreCurrentlyActive } = require("../util/event-filter.util");
// other
require('dotenv').config();
const moment = require('moment-timezone');
moment.tz.setDefault("Europe/Berlin");

const { HomematicApi } = require("./../homematic/homematic-api");

const { Lock } = require("../homematic/lock/lock");
const { LockDB } = require("../homematic/lock/lock.db");
const { GroupManager } = require("../homematic/group/group-manager");
const { GroupStateDB } = require("../homematic/group/group-state.db");
const { GroupState } = require("../homematic/group/group-state");
const { RoomConfiguration } = require("../homematic/room/room-config");
const { GroupStateBuilder } = require("../homematic/group/group-state.builder");
const { Uptime } = require("../../uptime");
const { Logger } = require("../util/logger");


/** ------------------- */
/** ------ ENTRY ------ */
/** ------------------- */

/**
 * @type RoomConfigurationDB
 */
var roomConfigurationDB;

/**
 * Initialize run for heating adjustment
 */
async function execute() {
    await manageLocks();

    roomConfigurationDB = new RoomConfigurationDB();
    const events = await getEvents();
    handleEvents(events);
}

/**
 * If no lock exists for the room, reset it to idle
 */
async function resetEverythingIfNotLocked(earlierResetNotPossible) {
    const roomConfigs = roomConfigurationDB.getAll();
    const homematicAPI = new HomematicApi();
    const resetNotPossible = {};

    // set boolean if this reset is a retry (if ealier one reset didnt work)
    const earlierResetNotPossibleBool = Object.keys(earlierResetNotPossible).length >= 0;

    for (const roomConfig of roomConfigs) {
        const hmip_groupId = roomConfig.homematicId;

        // dont reset, if previous reset worked
        if (earlierResetNotPossibleBool && earlierResetNotPossible[hmip_groupId] === undefined) {
            continue;
        }

        var tags = { module: "CRON", function: "RESET", group: hmip_groupId };
        try {
            try {
                const lockDB = new LockDB();
                const lock = lockDB.getByGroupId(hmip_groupId);
                Logger.warn({ tags, message: `Room reset not possible - LOCKED` });
                continue; // element is locked - dont reset
            } catch (e) {
                await homematicAPI.setTemperatureForGroup(hmip_groupId, roomConfig.desiredTemperatureIdle);
                Logger.debug({ tags, message: `Room reset successful` });
                delete resetNotPossible[hmip_groupId];
            }
        } catch (e) {
            Uptime.pingUptime("down", "Can not reset " + roomConfig.homematicName, "CRON");
            Logger.error({ tags, message: `Room reset not possible: ${e}` });
            resetNotPossible[hmip_groupId] = true;
        }
    }

    return resetNotPossible;
}

/**
 * Filter relevant HEATING events and execute event handling.
 * Relevant events are events that did not start yet.
 * 
 * @param {*} events    Array of events that need to be filtered
 * 
 * @returns void
 */
const handleEvents = (events) => {
    var tags = { module: "CRON", function: "EVENT" };
    Logger.info({ tags, message: "Start event handling" });
    const filteredEvents = filterEventsThatDidNotStartYetOrAreCurrentlyActive(events);

    filteredEvents.forEach(event => {
        handleEventForHeatingAdjustment(event);
    });

    Logger.info({ tags, message: "Finished event handling" });
};

/**
 * Filter relevant IDLE events and execute event handling.
 * Relevant events are events that ended in the last cronjob timeframe.
 *
 * @param {*} events
 * 
 * @returns void
 */
async function manageLocks() {
    const roomConfigs = roomConfigurationDB.getAll();

    var tags = { module: "CRON", function: "LOCKS" };
    Logger.debug({ tags, message: "Resolving locks" });
    for (const roomConfig of roomConfigs) {
        await manageLockForRoom(roomConfig);
    }
}

/**
 * @param {RoomConfiguration} roomConfig 
 */
async function manageLockForRoom(roomConfig) {
    const hmip_groupId = roomConfig.homematicId;
    var tags = { module: "CRON", function: "LOCKS", group: roomConfig.homematicId };

    /** @type {Lock} */
    var lock;

    try {
        const lockDB = new LockDB();
        lock = lockDB.getByGroupId(hmip_groupId);
        Logger.debug({ tags, message: "Room locked" });
    } catch (e) {
        Logger.debug({ tags, message: "Room not locked - SKIP" });
        // element is not locked
        // nothing to do (no resolve needed)
        return;
    }

    if (lock.isExpired()) {
        Logger.debug({ tags, message: "Room lock expired" });
        const groupStateDB = new GroupStateDB();
        const groupState = groupStateDB.getById(hmip_groupId);
        const groupManager = new GroupManager(groupState.id, roomConfig, groupState);

        try {
            Logger.debug({ tags, message: "Room lock expired" });
            await groupManager.setToIdle(lock.eventName);
            const lockDB = new LockDB();
            lockDB.delete(lock);

            EventLogger.resolveLock(groupState, roomConfig.desiredTemperatureIdle, lock);
        } catch (e) {
            Logger.error({ tags, message: "Can't set temperature back to IDLE" });
            throw Error("Cannnot set room to idle");
        }
    }
}

/**
 * @param {*} event     Event to manage
 * 
 * @returns void
 */
const handleEventForHeatingAdjustment = (event) => {
    var tags = { module: "CRON", function: "EVENT" };
    Logger.debug({ tags, message: `Handling event ${event.bezeichnung}` });

    const bookings = event.bookings;

    if (!bookings) {
        Logger.debug({ tags, message: `Event has no bookings` });
        return;
    }

    const bookingKeys = Object.keys(bookings);

    Logger.debug({ tags, message: `Event has ${bookingKeys.length} bookings` });
    bookingKeys.forEach(bookingKey => {
        const booking = bookings[bookingKey];
        handleBookingOfEventHeating(event, booking);
    });
};

/**
 * Determine if heating needs to be started for passed booking
 * 
 * @param {*} event     Event containing passed booking 
 * @param {*} booking   Booking (room) to possibly adjust
 * 
 * @returns void
 */
const handleBookingOfEventHeating = async (event, booking) => {
    /** @type {RoomConfiguration} */
    var roomConfiguration;

    // ONLY ALLOW ROOMS WITH STATUS "gebucht"
    if (booking.status_id !== "2") return;

    try {
        roomConfiguration = roomConfigurationDB.getByChurchtoolsId(booking.resource_id);
    } catch (e) {
        Logger.debug({ tags: { module: "CONFIG" }, message: `Booked resource with id ${booking.resource_id} does not exist in HMIP` });
        return;
    };

    const lockDB = new LockDB();

    try {
        lockDB.getByGroupId(roomConfiguration.homematicId);
        var tags = { module: "CRON", function: "EVENT", group: roomConfiguration };
        Logger.debug({ tags, message: `${roomConfiguration.name} is locked - SKIP` });
        return; // room locked - stop
    } catch (e) {
        // no locks, all good;
    }

    const groupStateDB = new GroupStateDB();
    const groupStateBuilder = new GroupStateBuilder();
    var groupState;

    try {
        groupState = groupStateDB.getById(roomConfiguration.homematicId);
    } catch (e) {
        groupState = groupStateBuilder.buildInitGroupState(roomConfiguration.homematicId);
    }

    var minutesNeededToReachDesiredTemperature = roomConfiguration.getMinutesNeededToReachTemperatureForEvent(event, groupState);
    const minpreOfBooking = booking.minpre;
    minutesNeededToReachDesiredTemperature += minpreOfBooking;
    const calculatedTimeToStartHeating = moment(event.startdate).subtract(minutesNeededToReachDesiredTemperature, "minute");

    const calculatedTimeIsOverdue = calculatedTimeToStartHeating.isBefore(moment());
    const eventAlreadyStarted = moment(event.startdate).isBefore(moment());

    if (calculatedTimeIsOverdue || eventAlreadyStarted) {
        try {
            const groupManager = new GroupManager(groupState.id, roomConfiguration, groupState);
            await groupManager.heatForEvent(event);

            EventLogger.groupUpdatePreheat(groupState.label, roomConfiguration.getDesiredRoomTemepratureForEvent(event), event);
            EventLogger.heatingTimeExpectancy(minutesNeededToReachDesiredTemperature, minpreOfBooking);

            const lock = new Lock();
            lock.expiring = moment(event.enddate);
            lock.eventName = event.bezeichnung;
            lock.groupId = groupState.id;
            lockDB.save(lock);
        } catch (e) {
            if (e.message !== "Blocked") console.log(e);

            // blocked due to existing manual override
            EventLogger.groupUpdatePreheatBlocked(event.bezeichnung, groupState.label);
        }
    }
};

module.exports = { execute, resetEverythingIfNotLocked };