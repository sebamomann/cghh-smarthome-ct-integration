'use strict';

const moment = require('moment-timezone');
moment().tz("Europe/Berlin").format();

const { getEvents } = require("./churchtools/events");
const { State } = require("./churchtools/state.class");
const { sendRequest } = require("./examples/sendRequestToAssistant");
const CronJob = require('cron').CronJob;

require('dotenv').config();

var state;
const cronInterval = 5; // minutes

const job = new CronJob(process.env.CRON_DEFINITION, () => run());
job.start();

async function run() {
    console.log("[" + moment().toLocaleString() + "] [CRON] Executing");

    state = new State();
    const events = await getEvents();

    handleEvents(events);

    state.writeToFile();
}

function handleEvents(events) {
    // handle idle first
    events.forEach(event => {
        const bookings = event.bookings;
        const bookingKeys = Object.keys(bookings);

        handleBookingsOfEvent(bookingKeys, bookings, event, false);
    });

    // handle heating after
    events.forEach(event => {
        const bookings = event.bookings;
        const bookingKeys = Object.keys(bookings);

        handleBookingsOfEvent(bookingKeys, bookings, event, true);
    });
}

function handleBookingsOfEvent(bookingKeys, bookings, event, forHeating) {
    bookingKeys.forEach(bookingKey => {
        const booking = bookings[bookingKey];
        const roomId = booking.resource_id;

        const room = state.getRoomById(roomId);

        if (room) {
            if (forHeating) {
                handleBookingForHeating(event, room);
            } else {
                handleBookingForIdle(event, room);
            }
        }
    });
}

function handleBookingForHeating(event, room) {
    const currentTime = moment();
    const eventPreheatStartTime = moment(event.startdate).subtract(room.heatingOffset, "minute");
    const eventPreheatStartTimeInterval = moment(event.startdate).subtract(room.heatingOffset + cronInterval, "minute");

    const isPreheatingStartTimeInTimeframe = currentTime.isBetween(eventPreheatStartTimeInterval, eventPreheatStartTime);
    const isRoomAlreadyHeating = room.currentlyHeating;

    // check needed so manual override is not overridden by code
    if (isPreheatingStartTimeInTimeframe && !isRoomAlreadyHeating) {
        sendRequestToThermostat(room, event);
    }
}

function handleBookingForIdle(event, room) {
    const currentTime = moment();
    const eventIdleStartTime = moment(event.enddate).subtract(room.heatingOffsetIdle, "minute");
    const eventIdleStartTimeInterval = moment(event.enddate).subtract(room.heatingOffsetIdle + cronInterval, "minute");

    const isIdleStartTimeInTimeframe = currentTime.isBetween(eventIdleStartTimeInterval, eventIdleStartTime);
    const isRoomCurrentlyHeatingForThisEvent = room.heatedForEvent === event.bezeichnung;

    // check needed so manual override is not overridden by code
    if (isIdleStartTimeInTimeframe && isRoomCurrentlyHeatingForThisEvent) {
        sendRequestToThermostatIdle(room, event);
    }
}

function sendRequestToThermostat(room, event) {
    room.currentlyHeating = true;
    room.heatedForEvent = event.bezeichnung;

    const request = `Setze die Temperatur in ${room.homematicName} auf ${room.desiredTemperature} Grad`;

    console.log(`[${moment()}] [ROOM UPDATE] [+] ${room.homematicName} to ${room.desiredTemperature} for ${event.bezeichnung} starting at ${event.startdate}`);
    sendRequest(request);
}

function sendRequestToThermostatIdle(room, event, heating) {
    room.currentlyHeating = false;
    room.heatedForEvent = null;

    const request = `Setze die Temperatur in ${room.homematicName} auf ${room.desiredTemperatureIdle} Grad`;

    console.log(`[${moment()}] [ROOM UPDATE] [-] ${room.homematicName} to ${room.desiredTemperatureIdle} for ${event.bezeichnung} ending at ${event.startdate}`);
    sendRequest(request);
}

run();
