'use strict';

const axios = require('axios');
const moment = require('moment');
const { MAXIMALE_VORLAUFZEIT } = require('../constants');

async function getEvents() {
    var url = "https://heidelsheim.church.tools/index.php?q=churchcal/ajax&func=getCalendarEvents&from=-1&to=1";
    const categoryIds = [9, 36, 2, 3, 5, 1, 14, 4, 13, 39];

    categoryIds
        .forEach(id => {
            url += "&category_ids[]=" + id;
        });

    try {
        const response = await axios.get(url, {
            withCredentials: true,
            "headers": {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
                "cookie": "ChurchTools_ct_heidelsheim=blbqhuk20jv4k3k11p1jkb408u"
            }
        });

        var events = response.data.data;

        return events;
    } catch (error) {
        console.log(error);
    }
};

module.exports = { getEvents };
