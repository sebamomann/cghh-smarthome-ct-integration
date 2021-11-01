/**
 * Take information of a {@link GroupState} and parse it into a influx usable DB object 
 * 
 * @param {GroupState} group 
 * 
 * @returns void
 */
const parseGroupStateIntoInfluxDataObject = (state) => {
    return {
        label: state.label,
        values: {
            temperature: state.temperature,
            setTemperature: state.setTemperature,
            humidity: state.humidity,
        }
    };
};

const parseDeviceStateChannelIntoInfluxDataObject = (state, channel) => {
    return {
        label: state.label,
        values: {
            temperature: channel.temperature,
            setTemperature: channel.setTemperature,
            valvePosition: channel.valvePosition * 100,
        },
        tags: {
            channel: channel.index
        }
    };
};

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
const parseHeatingThermostatChannelDataIntoInfluxDataObject = (device, channel) => {
    const deviceSetPointTemperature = channel.setPointTemperature;
    const deviceActualValveTemperature = channel.valveActualTemperature;

    return {
        label: device.data.label,
        values: {
            temperature: deviceActualValveTemperature,
            setTemperature: deviceSetPointTemperature
        },
        tags: {
            channel: channel.index
        }
    };
};

const parseHomeWeatherDataIntoInfluxDataObject = (home) => {
    const temperature = home.weather.temperature;
    const minTemperature = home.weather.minTemperature;
    const maxTemperature = home.weather.maxTemperature;
    const windSpeed = home.weather.windSpeed;
    const humidity = home.weather.humidity;
    const location = home.location.city.split(",")[0];

    return {
        label: location,
        values: {
            temperature: temperature,
            humidity: humidity,
            minTemperature,
            maxTemperature,
            windSpeed,
        },
        tags: {
            weatherDayTime: home.weather.weatherDayTime,
            weatherConditiion: home.weather.weatherCondition
        }
    };
};

module.exports = {
    parseGroupStateIntoInfluxDataObject,
    parseDeviceStateChannelIntoInfluxDataObject,
    parseHeatingGroupDataIntoInfluxDataObject,
    parseHeatingThermostatChannelDataIntoInfluxDataObject,
    parseHomeWeatherDataIntoInfluxDataObject
};