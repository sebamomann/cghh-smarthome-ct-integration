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
    EventLogger.startCron();

    roomConfigurationDB = new RoomConfigurationDB();
    const events = await getEvents();

    await manageLocks();
    handleEvents(events);
}

/**
 * If no lock exists for the room, reset it to idle
 */
async function resetEverythingIfNotLocked() {
    const roomConfigs = roomConfigurationDB.getAll();
    const homematicAPI = new HomematicApi();

    for (const roomConfig of roomConfigs) {
        const hmip_groupId = roomConfig.homematicId;

        try {
            try {
                const lockDB = new LockDB();
                const lock = lockDB.getByGroupId(hmip_groupId);
                continue;
            } catch (e) {
                await homematicAPI.setTemperatureForGroup(hmip_groupId, roomConfig.desiredTemperatureIdle);
                console.log("[CRON] [RESET] Successfully reset hmip_group " + hmip_groupId + " (" + roomConfig.homematicName + ") to " + roomConfig.desiredTemperatureIdle);
            }
        } catch (e) {
            console.log("[ERROR] [RESET] could not reset hmip_group " + hmip_groupId + " (" + roomConfig.homematicName + ") to " + roomConfig.desiredTemperatureIdle);
            console.log("[ERROR] [RESET] " + e);
        }
    }
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
    const filteredEvents = filterEventsThatDidNotStartYetOrAreCurrentlyActive(events);

    filteredEvents.forEach(event => {
        handleEventForHeatingAdjustment(event);
    });
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

    for (const roomConfig of roomConfigs) {
        await manageLockForRoom(roomConfig);
    }
}

/**
 * @param {RoomConfiguration} roomConfig 
 */
async function manageLockForRoom(roomConfig) {
    const hmip_groupId = roomConfig.homematicId;

    /** @type {Lock} */
    var lock;

    try {
        const lockDB = new LockDB();
        lock = lockDB.getByGroupId(hmip_groupId);
    } catch (e) {
        return;
    }

    if (lock.isExpired()) {
        const groupStateDB = new GroupStateDB();
        const groupState = groupStateDB.getById(hmip_groupId);
        const groupManager = new GroupManager(groupState.id, roomConfig, groupState);
        await groupManager.setToIdle(lock.eventName);
        const lockDB = new LockDB();
        lockDB.delete(lock);

        EventLogger.resolveLock(groupState.label, roomConfig.desiredTemperatureIdle, lock);
    }
}

/**
 * @param {*} event     Event to manage
 * 
 * @returns void
 */
const handleEventForHeatingAdjustment = (event) => {
    const bookings = event.bookings;

    if (!bookings) return;

    const bookingKeys = Object.keys(bookings);

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
        console.log("[CONFIG] [ERROR] Room not found by CT ID: " + booking.resource_id);
        return;
    }

    const lockDB = new LockDB();

    try {
        lockDB.getByGroupId(roomConfiguration.homematicId);
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