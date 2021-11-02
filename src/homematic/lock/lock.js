const moment = require('moment-timezone');
moment.tz.setDefault("Europe/Berlin");

class Lock {

    /** @type {string} */
    groupId;
    /** @type {string} UTC Timestamp as string*/
    expiring;
    /** @type {string} */
    eventName;

    constructor() {

    }

    /**
     * @returns {boolean}
     */
    isExpired = () => {
        const currentTime = moment();
        const expiryDate = moment(this.expiring);

        return currentTime.isAfter(expiryDate);
    };
}

module.exports = { Lock };