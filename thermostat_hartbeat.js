
const fs = require("fs");
const { HomematicApi } = require("./homematic-api");
const { InfluxDBManager } = require("./influx-db");

const restApi = new HomematicApi();
const influxDB = new InfluxDBManager();

async function thermostatHeartbeat() {
    console.log("[CRON] [HB] Executing");

    const groupsWithType = getGroupsWithTypeWallthermostat();
    const homeState = await restApi.getCurrentHomeState();

    const weather = homeState.home.weather;
    const homematicGroups = homeState.groups;

    const filteredGroups = filterHomematicGroupsByGroupsWithTypeWallThermostat(homematicGroups, groupsWithType);

    filteredGroups.forEach(group => {
        influxDB.sendThermostatInformation(group);
    });
    influxDB.sendWeatherInformation(weather);
}

function filterHomematicGroupsByGroupsWithTypeWallThermostat(homematicGroups, groupsWithType) {
    const groupIdsToGet = groupsWithType.map(group => group.id);

    const filteredGroups = [];

    groupIdsToGet.forEach(id => {
        filteredGroups.push(homematicGroups[id]);
    });

    return filteredGroups;
}

/**
 * Get all groups from json file that are of type "wallthermostat"
 * @returns 
 */
function getGroupsWithTypeWallthermostat() {
    const data = fs.readFileSync("./homematic_groups.json", 'utf8');
    const json_data = JSON.parse(data);

    return json_data.groups.filter(element => element.type === "wallthermostat");
}

module.exports = { thermostatHeartbeat };