// classes
const { RoomConfigurationFetcher } = require("./churchtools/room-config-fetcher.class");
const { RoomConfiguration } = require('./churchtools/room-config.class');
const { HomematicApi } = require('../homematic/homematic-api');
// functions
const { getEvents } = require("./events");
// elements
const moment = require('moment-timezone');
const { filterEventsThatEndedInTheLastCronTimeframe, filterEventsThatDidNotStartYet } = require("../util/event-filter.util");
const { HomematicGroupMapper } = require("../util/homematic-group.mapper");
const { HomeState } = require("./churchtools/home-state.class");
moment.tz.setDefault("Europe/Berlin");
// other
require('dotenv').config();


/** ------------------- */
/** ------ ENTRY ------ */
/** ------------------- */

/**
 * @type {RoomConfigurationFetcher}
 */
var roomConfigurationFetcher;

/**
 * Initialize run for heating adjustment
 */
async function execute() {
    console.log("[CRON] Executing");

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
function handleEvents(events) {
    handleEventsForIdleAdjustments(events);
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
    const filteredEvents = filterEventsThatDidNotStartYet(events);

    filteredEvents.forEach(event => {
        handleEventForHeatingAdjustment(event, true);
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
function handleEventsForIdleAdjustments(events) {
    const filteredEvents = filterCurrenltyActiveEvents(events);
    const homeState = new HomeState();
    const roomConfigurationFetcher = new RoomConfigurationFetcher();

    const groupKeys = Object.keys(homeState.state);
    groupKeys.forEach(
        (groupKey) => {
            const groupState = homeState.state[groupKey];
            const roomConfiguration = roomConfigurationFetcher.getRoomConfigurationById(groupState.label);

            // TODO
            const idleTemperatureForRoom = roomConfiguration.desiredTemperatureIdle;

            const roomIsInUse = groupState.values.setTemperature;
        }
    );

    filteredEvents.forEach(event => {
        handleEventForIdleAdjustment(event);
    });
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
 * @param {*} event     Event to manage
 * 
 * @returns void
 */
const handleEventForIdleAdjustment = (event) => {
    handleBookingsOfEvent(event, handleBookingOfEventIdle);
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
const handleBookingOfEventHeating = (event, booking) => {
    var roomConfiguration;

    try {
        roomConfiguration = getRoomConfigurationForBooking(booking);
    } catch (e) {
        return;
    }

    const minutesNeededToReachDesiredTemperature = roomConfiguration.getMinutesNeededToReachTemperatureForEvent(event);
    const calculatedTimeToStartHeating = moment(event.startdate).subtract(minutesNeededToReachDesiredTemperature, "minute");

    // if temperature is bigger than set temperature, still set thermostat to temp for logging
    // happens if minutesToReachTemperature is 0
    const eventIsInFiveMinutesOrLess = moment(event.startdate).subtract(5, "minute").isBefore(moment());
    const calculatedTimeIsOverdue = calculatedTimeToStartHeating.isBefore(moment());

    if (calculatedTimeIsOverdue || eventIsInFiveMinutesOrLess) {
        initializeHeatingForRoom(event, roomConfiguration);
        console.log(`[${moment()}] [CRON] [ROOM UPDATE] [+] Should take ${minutesNeededToReachDesiredTemperature} minutes`);
    }
};

/**
 * Execute adjustment to idle for booking (contained room)
 *
 * @param {*} event     Event containing passed booking
 * @param {*} booking   Booking (room) to adjust
 *
 * @returns void
 */
const handleBookingOfEventIdle = (event, booking) => {
    try {
        const roomConfiguration = getRoomConfigurationForBooking(booking);
        initializeIdleForRoom(event, roomConfiguration);
    } catch (e) {
        return;
    }
};

/**
 * Convert the room reference of the passed booking into the current {@link RoomConfiguration}
 * 
 * @param {*} booking   Booking containing room reference
 * 
 * @returns {RoomConfiguration}
 */
const getRoomConfigurationForBooking = (booking) => {
    const ct_roomId = booking.resource_id;

    try {
        return roomConfigurationFetcher.getRoomConfigurationById(ct_roomId);
    } catch (e) {
        throw new Error("Room does not exist in HMIP");
    }
};

/**
 * Get all relevant data for sending update request to homematic API for HEATING
 * 
 * @param {*} event 
 * @param {RoomConfiguration} roomConfiguration
 * 
 * @returns void
 */
function initializeHeatingForRoom(event, roomConfiguration) {
    const desiredTemperature = roomConfiguration.getDesiredRoomTemepratureForEvent(event);
    const hmip_groupId = HomematicGroupMapper.getGroupIdByName(roomConfiguration.homematicName);

    updateTemperatureForGroup(hmip_groupId, desiredTemperature);
    console.log(`[${moment()}] [CRON] [ROOM UPDATE] [+] ${desiredTemperature} for ${event.bezeichnung} starting at ${event.startdate}`);
}

/**
 * Get all relevant data for sending update request to homematic API for IDLE
 * 
 * @param {*} event 
 * @param {RoomConfiguration} roomConfiguration 
 * 
 * @returns void
 */
const initializeIdleForRoom = (event, roomConfiguration) => {
    const desiredTemperature = roomConfiguration.desiredTemperatureIdle;
    const hmip_groupId = HomematicGroupMapper.getGroupIdByName(roomConfiguration.homematicName);

    updateTemperatureForGroup(hmip_groupId, desiredTemperature);
    console.log(`[${moment()}] [CRON] [ROOM UPDATE] [-] ${desiredTemperature} for ${event.bezeichnung} ending at ${event.enddate}`);
};

/**
 * Execute request sending to homematic API
 * 
 * @param {string} hmip_groupId         Group to update
 * @param {number} desiredTemperature   Temperature to be set
 * @param {*} event                     Event that caused the change
 * @param {boolean} toIdle              Is change to idle temperature
 */
const updateTemperatureForGroup = async (hmip_groupId, desiredTemperature) => {
    const api = new HomematicApi();
    await api.setTemperatureForGroup(hmip_groupId, desiredTemperature);
};

module.exports = { execute };