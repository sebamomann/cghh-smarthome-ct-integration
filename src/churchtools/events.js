'use strict';

require('dotenv').config();
const axios = require('axios');

var cookietoken = "";

// TODO CT API CLASS
async function getEvents() {
    await loginForSessionRevalidation();

    var url = "https://heidelsheim.church.tools/index.php?q=churchcal/ajax&func=getCalendarEvents&from=-1&to=1";
    const categoryIds = process.env.CALENDAR_CATEGORIES.split(",");

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
                "cookie": "ChurchTools_ct_heidelsheim=" + cookietoken
            }
        });

        var events = response.data.data;

        if (response.data.status === "error") {
            throw new Error(response.data);
        }

        return events;
    } catch (error) {
        throw new Error(error);
    }
};

async function loginForSessionRevalidation() {
    try {
        const response = await axios.post("https://heidelsheim.church.tools/api/login", {
            "username": process.env.CT_USERNAME,
            "password": process.env.CT_PASSWORD
        }, {
            withCredentials: true
        });

        cookietoken = response.headers["set-cookie"][0].split(";")[0].split("=")[1];

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