const { WebsocketManager } = require("./websocket-manager");

const { parseHeatingGroupDataIntoInfluxDataObject, parseHeatingThermostatChannelDataIntoInfluxDataObject, parseHomeWeatherDataIntoInfluxDataObject } = require("./homematic-influx.mapper");

const { Group } = require("./homematic/group");
const { Device } = require("./homematic/device");

const { LastSentDataManager } = require("./last-sent-data-manager");

const { HeatingGroupDataSender } = require("./heating-group-data-sender");
const { WeatherDataSender } = require("./weather-data-sender");

require("dotenv").config();

const startEventListener = () => {
    const websocketManager = new WebsocketManager(process.env.HOMEMATIC_WS_URL);
    const headers = {
        'AUTHTOKEN': process.env.HOMEMATIC_API_AUTHTOKEN,
        'CLIENTAUTH': process.env.HOMEMATIC_API_CLIENTAUTH,
    };
    websocketManager.setHeaders(headers);
    websocketManager.connect(callback);
};

/**
 * Callback function that gets executed when the websocket receives a new event
 * 
 * @param {*} data 
 */
const callback = (data) => {
    const rawBuffer = data.toString("utf8");
    const jsonData = JSON.parse(rawBuffer);

    const events = jsonData.events; // note: element is no array but an object with id's as identifier for each event 
    const eventIds = Object.keys(events);

    eventIds
        .forEach(eventId => {
            const event = events[eventId];
            handleElement(event);
        });
};

/**
 * Handle event data send over websocket connection
 * 
 * @param {*} event 
 */
const handleElement = (event) => {
    if (event.pushEventType === "GROUP_CHANGED") {
        handleGroupChangedEvent(event);
    } else if (event.pushEventType === "DEVICE_CHANGED") {
        handleDeviceChanged(event);
    } else if (event.pushEventType === "HOME_CHANGED") {
        handleHomeChangeEvent(event);
    }
};

/**
 * Parse update group data object.
 * Determine if is heating group.
 * Determine if values did change.
 * 
 * Initialize data send
 * 
 * @param {*} event 
 */
const handleGroupChangedEvent = (event) => {
    const rawGroup = event.group;

    if (!rawGroup) return;

    const group = new Group(rawGroup);

    if (!group.isHeatingGroup()) return;
    if (!group.containsThermostat()) return;

    const data = parseHeatingGroupDataIntoInfluxDataObject(group);

    sendGroupData(data);
};

/**
 * Parse update device data object.
 * Determine if is heating thermostat.
 * 
 * Initialize data send
 *
 * @param {*} event
 */
const handleDeviceChanged = (event) => {
    const rawDevice = event.device;

    if (!rawDevice) return;

    const device = new Device(rawDevice);

    if (!device.isHeatingThermostat()) return;

    const functionChannel = device.getRelevantFunctionalChannel();
    const data = parseHeatingThermostatChannelDataIntoInfluxDataObject(functionChannel);
    sendGroupData(data);
};

/**
 * Parse updated home state.
 * Determine if weather information is present.
 *
 * Initialize data send
 * 
 * @param {*} event 
 */
const handleHomeChangeEvent = (event) => {
    const raw_weather = event.home.weather;

    if (!raw_weather) return;

    const data = parseHomeWeatherDataIntoInfluxDataObject(raw_weather);

    sendWeatherData(data);
};

// TODO
// SEND TO OWN BUCKET
/**
 * Check if group data changed.
 * Initialize data send.
 * Log event.
 * 
 * @param {*} data 
 */
const sendGroupData = (data) => {
    const lastSentDataManager = new LastSentDataManager(data);

    if (lastSentDataManager.lastSentDataIsStillCorrect()) return;

    const dataSender = new HeatingGroupDataSender();
    dataSender.sendData(lastSentDataManager.lastData, data);

    lastSentDataManager.updateLastSent();

    const lsdm = lastSentDataManager.lastData;

    console.log("[Event] [GROUP UPDATE] [FROM] " + lsdm.label + " Set: " + lsdm.values.setTemperature.toFixed(1) + " Current: " + lsdm.values.temperature.toFixed(1) + " Hum: " + lsdm.values.humidity?.toFixed(1));
    console.log("[Event] [GROUP UPDATE] [TOOO] " + data.label + " Set: " + data.values.setTemperature.toFixed(1) + " Current: " + data.values.temperature.toFixed(1) + " Hum: " + data.values.humidity?.toFixed(1));
    console.log("-----");
};

// TODO
// SEND TO OWN BUCKET
/**
 * Check if weather data changed.
 * Initialize data send.
 * Log event.
 *
 * @param {*} data
 */
const sendWeatherData = (data) => {
    const lastSentDataManager = new LastSentDataManager(data);

    if (lastSentDataManager.lastSentDataIsStillCorrect()) return;

    const dataSender = new WeatherDataSender();
    dataSender.sendData(lastSentDataManager.lastData, data);

    lastSentDataManager.updateLastSent();

    const lsdm = lastSentDataManager.lastData;

    console.log("[Event] [WEATHER UPDATE] [FROM] Temp: " + lsdm.values.temperature.toFixed(1) + " Hum: " + lsdm.values.humidity.toFixed(1));
    console.log("[Event] [WEATHER UPDATE] [TOOO] Temp: " + data.values.temperature.toFixed(1) + " Hum: " + data.values.humidity.toFixed(1));
    console.log("-----");
};

module.exports = { startEventListener };