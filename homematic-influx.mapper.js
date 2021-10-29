const fs = require("fs");

/**
 * Take information of heating group and parse it into a influx parsable DB object 
 * 
 * @param {*} group 
 * @returns 
 */
const parseHeatingGroupDataIntoInfluxDataObject = (group) => {
    return {
        label: group.data.label,
        values: {
            temperature: group.data.actualTemperature,
            setTemperature: group.data.setPointTemperature,
            humidity: group.data.humidity,
        }
    };
};

/**
 * Take information of heating group and parse it into a influx parsable DB object 
 * 
 * @param {*} group 
 * @returns 
 */
const parseHeatingThermostatChannelDataIntoInfluxDataObject = (functionChannel) => {
    const deviceGroupId = functionChannel.groups[0];
    const groupLabel = getGroupsLabelById(deviceGroupId);

    const deviceSetPointTemperature = functionChannel.setPointTemperature;
    const deviceActualValveTemperature = functionChannel.valveActualTemperature;

    return {
        label: groupLabel,
        values: {
            temperature: deviceActualValveTemperature,
            setTemperature: deviceSetPointTemperature
        }
    };
};

const parseHomeWeatherDataIntoInfluxDataObject = (weather) => {
    const temperature = weather.temperature;
    const humidity = weather.humidity;

    return {
        label: "Wetter",
        values: {
            temperature: temperature,
            humidity: humidity
        }
    };
};

function getGroupsLabelById(id) {
    const data = fs.readFileSync("./homematic_groups.json", 'utf8');
    const json_data = JSON.parse(data);

    return json_data.groups.find(element => element.id === id)?.name;
}


module.exports = {
    parseHeatingGroupDataIntoInfluxDataObject,
    parseHeatingThermostatChannelDataIntoInfluxDataObject,
    parseHomeWeatherDataIntoInfluxDataObject
};