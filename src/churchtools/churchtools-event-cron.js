// classes
const { GroupStateBuilder } = require("./../homematic/group/group-state.builder");

const { RoomConfigurationFetcher } = require('./../homematic/room/room-config.fetcher');
const { RoomConfiguration } = require('./../homematic/room/room-config');

// functions
const { getEvents } = require("./events");
// elements
const { filterEventsThatDidNotStartYetOrAreCurrentlyActive } = require("../util/event-filter.util");

// other
require('dotenv').config();
const moment = require('moment-timezone');
moment.tz.setDefault("Europe/Berlin");
const fs = require("fs");

/** ------------------- */
/** ------ ENTRY ------ */
/** ------------------- */

/**
 * @type RoomConfigurationFetcher
 */
var roomConfigurationFetcher;

/**
 * Initialize run for heating adjustment
 */
async function execute() {
    console.log(`[${moment().format("YYYY-MM-DD HH:mm:ss")}] [CRON] Executing`);

    roomConfigurationFetcher = new RoomConfigurationFetcher();
    const events = await getEvents();

    handleEvents(events);
}

/**
 * 1. Loop through events to check if thermostats can be adjusted to idle temperature
 * 2. Loop through events to check if thermostats need to be adjusted to preheat
 * 
 * @param {*} events    Events to consider for thermostat adjustments
 * 
 * @returns void
 */
async function handleEvents(events) {
    await resolveGroupLocks();
    handleEventsForHeatingAdjustments(events);
}

/**
 * Filter relevant HEATING events and execute event handling.
 * Relevant events are events that did not start yet.
 * 
 * @param {*} events    Array of events that need to be filtered
 * 
 * @returns void
 */
const handleEventsForHeatingAdjustments = (events) => {
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
async function resolveGroupLocks() {
    var groupsDataRaw;

    try {
        groupsDataRaw = fs.readFileSync(process.cwd() + "/config/room.config.json", 'utf8');
    } catch (e) {
        groupsDataRaw = "{}";
    }

    const json_data = JSON.parse(groupsDataRaw);
    const rooms = json_data.rooms;

    for (const room of rooms) {
        const groupId = room.homematicId;
        const groupStateBuilder = new GroupStateBuilder();
        const groupState = groupStateBuilder.groupStateFromFile(groupId);

        if (groupState.groupIsLocked() && groupState.groupLockIsExpired()) {
            await groupState.resolveLock();
        }
    }
}

/**
 * @param {*} event     Event to manage
 * 
 * @returns void
 */
const handleEventForHeatingAdjustment = (event) => {
    handleBookingsOfEvent(event, handleBookingOfEventHeating);
};

/**
 * Loopp through each booking of the event and execute custom fallback method, passing the booking
 * 
 * @param {*} event     Event containing bookings 
 * @param {*} callback  Callback to execute with each booking
 * 
 * @returns void
 */
const handleBookingsOfEvent = (event, callback) => {
    const bookings = event.bookings;

    if (!bookings) return;

    const bookingKeys = Object.keys(bookings);

    bookingKeys.forEach(bookingKey => {
        const booking = bookings[bookingKey];
        callback(event, booking);
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
    var roomConfiguration;

    try {
        roomConfiguration = roomConfigurationFetcher.getRoomConfigurationById(booking.resource_id);
    } catch (e) {
        return;
    }

    const groupStateBuilder = new GroupStateBuilder();
    const groupState = groupStateBuilder.groupStateFromFile(roomConfiguration.homematicId);

    if (groupState.groupIsLocked()) return;

    const minutesNeededToReachDesiredTemperature = roomConfiguration.getMinutesNeededToReachTemperatureForEvent(event, groupState);
    const calculatedTimeToStartHeating = moment(event.startdate).subtract(minutesNeededToReachDesiredTemperature, "minute");

    const calculatedTimeIsOverdue = calculatedTimeToStartHeating.isBefore(moment());
    const eventAlreadyStarted = moment(event.startdate).isBefore(moment());

    if (calculatedTimeIsOverdue || eventAlreadyStarted) {
        const initiated = await groupState.heatGroupForEvent(event);
        if (initiated) {
            console.log(`[${moment().format("YYYY-MM-DD HH:mm:ss")}] [CRON] [ROOM UPDATE] [+] Should take ~ ${Math.round(minutesNeededToReachDesiredTemperature)} minutes`);
        }
    }
};

module.exports = { execute };