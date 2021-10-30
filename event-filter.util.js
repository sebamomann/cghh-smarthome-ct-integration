const moment = require('moment-timezone');
moment.tz.setDefault("Europe/Berlin");

const CRON_INTERVAL = 10; // minutes

/**
 * @param {*} events    Array of events to filter
 *  
 * @returns Array of events with a startdate in the future
 */
function filterEventsThatDidNotStartYet(events) {
    const filteredEvents = [];

    events.forEach(
        (event) => {
            const currentTime = moment();
            const startTime = moment(event.startdate);

            if (startTime.isAfter(currentTime)) {
                filteredEvents.push(event);
            }
        }
    );

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
    filterEventsThatDidNotStartYet,
    filterEventsThatEndedInTheLastCronTimeframe
};