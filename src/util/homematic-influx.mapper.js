const { WeatherState } = require("../homematic/weather/weather-state");
const { WeatherStateAnlyzer } = require("../homematic/weather/weather-state.analyzer");

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

/**
 * Take information of a {@link WeatherState} and parse it into a influx usable DB object
 *
 * @param {WeatherState} group
 *
 * @returns void
 */
const parseWeatherStateIntoInfluxDataObject = (state) => {
    const temperature = state.temperature;
    const minTemperature = state.minTemperature;
    const maxTemperature = state.maxTemperature;
    const windSpeed = state.windSpeed;
    const vaporAmount = state.vaporAmount;
    const humidity = state.humidity;

    return {
        label: state.label,
        values: {
            temperature,
            humidity,
            minTemperature,
            maxTemperature,
            windSpeed,
            vaporAmount
        },
        tags: {
            weatherDayTime: state.weatherDayTime,
            weatherConditiion: state.weatherCondition
        }
    };
};

module.exports = {
    parseGroupStateIntoInfluxDataObject,
    parseDeviceStateChannelIntoInfluxDataObject,
    parseHeatingGroupDataIntoInfluxDataObject,
    parseHeatingThermostatChannelDataIntoInfluxDataObject,
    parseWeatherStateIntoInfluxDataObject
};