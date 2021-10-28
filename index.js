'use strict';

const moment = require('moment-timezone');
moment.tz.setDefault("Europe/Berlin");

const { getEvents } = require("./churchtools/events");
const { State } = require("./churchtools/state.class");
const { sendRequest } = require("./examples/google-assistant");
const { EventTemperatureMapper } = require("./churchtools/event-temperature.mapper");
const CronJob = require('cron').CronJob;
const { thermostatHeartbeat } = require('./thermostat_hartbeat');

require('dotenv').config();

var state;
const cronInterval = 5; // minutes

const job = new CronJob(process.env.CRON_DEFINITION, () => run());
job.start();

const job_hb = new CronJob(process.env.CRON_DEFINITION_HB, () => thermostatHeartbeat());
job_hb.start();

run();
thermostatHeartbeat();

/**
 * Initialize run for heating adjustment
 */
async function run() {
    console.log("[CRON] Executing");

    // thermostatHeartbeat();

    state = new State();
    const events = await getEvents();

    handleEvents(events);

    state.writeToFile();
}

/**
 * 1. Loop through events to check if thermostats can be adjusted to idle temperature
 * 2. Loop through events to check if thermostats needs to be adjusted to be set to be heating
 * 
 * @param {*} events    Events to consider for thermostat adjustments
 */
function handleEvents(events) {
    handleEventsForIdleAdjustments(events);
    handleEventsForHeatingAdjustments(events);
}

/**
 * Loop through each event.
 * Execute booking management for passed event to heat booked rooms
 * 
 * @param {*} events
 */
function handleEventsForHeatingAdjustments(events) {
    events.forEach(event => {
        handleBookingsOfEvent(event, true);
    });
}

/**
 * Loop through each event.
 * Execute booking management for passed event to set booked rooms to idle
 *
 * @param {*} events
 */
function handleEventsForIdleAdjustments(events) {
    events.forEach(event => {
        handleBookingsOfEvent(event, false);
    });
}

/**
 * Loop through each booking.
 * When a booking includes a valid room reservation execute preheating or idle for the booked room.
 * 
 * @param {*} bookingKeys 
 * @param {*} bookings 
 * @param {*} event 
 * @param {*} forHeating 
 */
function handleBookingsOfEvent(event, forHeating) {
    const bookings = event.bookings;

    if (!bookings)
        return;

    const bookingKeys = Object.keys(bookings);

    bookingKeys.forEach(bookingKey => {
        const booking = bookings[bookingKey];
        const roomId = booking.resource_id;

        const room = state.getRoomById(roomId);

        if (room) {
            if (forHeating) {
                handleRoomForEventHeating(event, room);
            } else {
                handleRoomForEventIdle(event, room);
            }
        }
    });
}

/**
 * Check if preheating is needed for the passed room
 *
 * @param {*} event     Event to check if heating is needed
 * @param {*} room      Room to manage
 */
function handleRoomForEventHeating(event, room) {
    const isPreheatingStartTimeInTimeframe = isCurrentTimeIsWithinTriggerTimeframe(event.startdate, room.heatingOffset);
    const isRoomAlreadyHeating = room.currentlyHeating;

    // check needed so manual override is not overridden by code
    if (isPreheatingStartTimeInTimeframe && !isRoomAlreadyHeating) {
        sendRequestToThermostat(room, event);
    }
}

/**
 * Check if heatind can be shut down for the passed room to save energy
 *
 * @param {*} event     Event to check if shutdown is possible
 * @param {*} room      Room to manage
 */
function handleRoomForEventIdle(event, room) {
    const isIdleStartTimeInTimeframe = isCurrentTimeIsWithinTriggerTimeframe(event.enddate, room.heatingOffsetIdle);
    const isRoomCurrentlyHeatingForThisEvent = room.heatedForEvent === event.bezeichnung;

    // check needed so manual override is not overridden by code
    if (isIdleStartTimeInTimeframe && isRoomCurrentlyHeatingForThisEvent) {
        sendRequestToThermostatIdle(room, event);
    }
}

/**
 * Check if current time is within timeframe to trigger heating/idle.
 * Timeframe is defined as
 * 
 * FROM: now - (offset + cron interval)
 * TO:   now - (offset) 
 * 
 * When from < now < to then return true
 * 
 * @return 
 */
function isCurrentTimeIsWithinTriggerTimeframe(date, offset) {
    const currentTime = moment();
    const upperIntervalBorder = moment(date).subtract(offset, "minute");
    const lowerIntervalBorder = moment(date).subtract(offset + cronInterval, "minute");

    return currentTime.isBetween(lowerIntervalBorder, upperIntervalBorder);
}

/**
 * Prepare and send the request to google assistant for adjust the thermostat for heating
 * 
 * @param {*} room      Room containing the Thermostat that needs to be updated
 * @param {*} event     Event for logging reasons
 */
function sendRequestToThermostat(room, event) {
    room.currentlyHeating = true;
    room.heatedForEvent = event.bezeichnung;

    const temperature = defineTemperatureForEvent(event, room);
    const request = `Setze die Temperatur in ${room.homematicName} auf ${temperature} Grad`;

    console.log(`[${moment()}] [ROOM UPDATE] [+] ${room.homematicName} to ${temperature === room.desiredTemperature ? "" : "[*] "}${temperature} for ${event.bezeichnung} starting at ${event.startdate}`);
    sendRequest(request);
}

/**
 * Prepare and send the request to google assistant for adjust the thermostat for idle
 *
 * @param {*} room      Room containing the Thermostat that needs to be updated
 * @param {*} event     Event for logging reasons
 */
function sendRequestToThermostatIdle(room, event) {
    room.currentlyHeating = false;
    room.heatedForEvent = null;

    const request = `Setze die Temperatur in ${room.homematicName} auf ${room.desiredTemperatureIdle} Grad`;

    console.log(`[${moment()}] [ROOM UPDATE] [-] ${room.homematicName} to ${room.desiredTemperatureIdle} for ${event.bezeichnung} ending at ${event.enddate}`);
    sendRequest(request);
}

/**
 * Get the temperature that needs to be set for the event and room
 * 
 * @param {*} event     Event that needs a preheated room
 * @param {*} room      Room that needs to be preheated
 * 
 * @returns Integer containing the desired temperature for the given room and event
 */
function defineTemperatureForEvent(event, room) {
    var temperature = EventTemperatureMapper.getTemperatureForEvent(event.bezeichnung);

    if (!temperature) {
        temperature = room.desiredTemperature;
    }

    return temperature;
}
