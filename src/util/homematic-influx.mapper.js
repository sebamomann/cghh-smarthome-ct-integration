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
        label: "sensoric",
        values: {
            temperature: state.temperature,
            setTemperature: state.setTemperature,
            humidity: state.humidity,
        },
        tags: {
            name: state.label.replace(/\s/g, "_"),
            type: "HEATING"
        }
    };
};

const parseDeviceStateChannelIntoInfluxDataObject = (state, channel) => {
    return {
        label: "sensoric",
        values: {
            temperature: channel.temperature,
            setTemperature: channel.setTemperature,
        },
        tags: {
            channel: channel.index,
            name: state.label.replace(/\s/g, "_"),
            type: "HEATING_THERMOSTAT"
        }
    };
};

const parseDeviceStateChannelIntoInfluxDataObjectState = (state, channel) => {
    return {
        label: "sensoric",
        values: {
            valvePosition: channel.valvePosition * 100,
        },
        tags: {
            channel: channel.index,
            name: state.label.replace(/\s/g, "_"),
            type: "HEATING_THERMOSTAT"
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
        // tags: {
        //     weatherDayTime: state.weatherDayTime,
        //     weatherCondition: state.weatherCondition,
        //     tag: "ALL"
        // }
    };
};

module.exports = {
    parseGroupStateIntoInfluxDataObject,
    parseDeviceStateChannelIntoInfluxDataObject,
    parseDeviceStateChannelIntoInfluxDataObjectState,
    parseHeatingGroupDataIntoInfluxDataObject,
    parseHeatingThermostatChannelDataIntoInfluxDataObject,
    parseWeatherStateIntoInfluxDataObject
};