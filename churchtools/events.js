'use strict';

require('dotenv').config();
const axios = require('axios');

async function getEvents() {
    await loginForSessionRevalidation();

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

async function loginForSessionRevalidation() {
    try {
        const response = await axios.post("https://heidelsheim.church.tools/api/login", {
            "username": process.env.CT_USERNAME,
            "password": process.env.CT_PASSWORD
        });

        if (response.data.data.status !== "success") {
            console.log("Login Error");
            console.log(response.data);
        }
    } catch (e) {
        console.log("Login Error");
        console.log(e);
    }
}

module.exports = { getEvents };