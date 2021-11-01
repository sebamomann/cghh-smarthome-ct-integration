const moment = require('moment-timezone');
moment.tz.setDefault("Europe/Berlin");

const CRON_INTERVAL = 10; // minutes

/**
 * @param {*} events    Array of events to filter
 *  
 * @returns Array of events with a startdate in the future
 */
function filterEventsThatDidNotStartYetOrAreCurrentlyActive(events) {
    const filteredEvents = [];

    events.forEach(
        (event) => {
            const currentTime = moment();
            const start = moment(event.startdate);
            const end = moment(event.enddate);

            const eventStartsInFuture = start.isAfter(currentTime);
            const eventIsCurrentlyActive = currentTime.isBetween(start, end);

            if (eventIsCurrentlyActive || eventStartsInFuture) {
                filteredEvents.push(event);
            }
        }
    );

    filteredEvents.sort((a, b) => moment(a.startdate) - moment(b.startdate));

    return filteredEvents;
}

/**
 * @param {*} events    Array of events to filter
 * 
 * @returns Array of events
 */
function filterEventsThatEndedInTheLastCronTimeframe(events) {
    const filteredEvents = [];

    events.forEach(event => {
        if (isDateBetweenNowAndLastXMinutes(event.enddate, CRON_INTERVAL)) {
            filteredEvents.push(event);
        }
    });

    return filteredEvents;
}

/**
 * Filter all events where start < current < end
 * 
 * @param {*} events    Array of events to filter
 * 
* @returns Array of events 
 */
const filterCurrenltyActiveEvents = (events) => {
    const filteredEvents = [];

    const currentTime = moment();

    events.forEach(
        (event) => {
            const start = moment(event.startdate);
            const end = moment(event.enddate);

            const eventIsActive = currentTime.isBetween(start, end);

            if (eventIsActive) {
                filteredEvents.push(event);
            }
        }
    );

    return filteredEvents;
};

/**
 * Not now, but between now + 1 and now - ( minutes - 1).
 * Due to no exact execution of cron
 * --> maybe cron is executed 1s before event end --> causes no break
 * 
 * @param {string} date     Date to check
 * @param {number} minutes  Timeframe in minutes from now to past
 * 
 * @return Boolean. True if in timeframe
 */
function isDateBetweenNowAndLastXMinutes(date, minutes) {
    const currentTime = moment().add(1, "minute");
    const lowerIntervalBorder = moment(currentTime).subtract(minutes - 1, "minute");

    return moment(date).isBetween(lowerIntervalBorder, currentTime);
}

module.exports = {
    filterEventsThatDidNotStartYetOrAreCurrentlyActive,
    filterEventsThatEndedInTheLastCronTimeframe,
    filterCurrenltyActiveEvents
};