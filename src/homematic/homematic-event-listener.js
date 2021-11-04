const { WebsocketManager } = require("../websocket-manager");

const { Group } = require("./group/group");
const { GroupState } = require("./group/group-state");
const { GroupStateDB } = require("./group/group-state.db");
const { GroupStateBuilder } = require("./group/group-state.builder");
const { GroupStateAnlyzer } = require("./group/group-state.analyzer");
const { GroupDataSender } = require("./group/group.data-sender");

const { Device } = require("./device/device");
const { DeviceState } = require("./device/device-state");
const { DeviceStateDB } = require("./device/device-state.db");
const { DeviceStateBuilder } = require("./device/device-state.builder");
const { DeviceStateAnalyzer } = require("./device/device-state.analyzer");
const { DeviceDataSender } = require("./device/device.data-sender");

const { Home } = require("./weather/home");
const { WeatherState } = require("./weather/weather-state");
const { WeatherStateDB } = require("./weather/weather-state.db");
const { WeatherStateBuilder } = require("./weather/weather-state.builder");
const { WeatherStateAnlyzer } = require("./weather/weather-state.analyzer");
const { WeatherDataSender } = require("./weather/weather.data-sender");

const { EventLogger } = require("../util/event.logger");

const moment = require('moment-timezone');
moment.tz.setDefault("Europe/Berlin");

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
        handleGroupChangeEvent(event);
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
const handleGroupChangeEvent = (event) => {
    const rawGroup = event.group;

    if (!rawGroup) return;

    const group = new Group(rawGroup);

    if (!group.isHeatingGroup()) return;

    const groupStateBuilder = new GroupStateBuilder();
    const groupStateDB = new GroupStateDB();

    var currentGroupState;

    try {
        currentGroupState = groupStateDB.getById(group.data.id);
    } catch (e) {
        currentGroupState = groupStateBuilder.buildInitGroupState();
    }

    const updatedGroupState = groupStateBuilder.groupStateFromHomematicGroup(group);

    updatedGroupState.lock = currentGroupState.lock;
    handleGroupStateChange(currentGroupState, updatedGroupState);
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

    const deviceStateBuilder = new DeviceStateBuilder();

    const currentDeviceState = deviceStateBuilder.deviceStateFromFile(device.data.id);
    const updatedDeviceState = deviceStateBuilder.deviceStateFromHomematicDevice(device);

    handleDeviceStateChange(currentDeviceState, updatedDeviceState);
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
    const rawHome = event.home;

    if (!rawHome) return;

    const home = new Home(rawHome);

    const weatherStateBuilder = new WeatherStateBuilder();

    const currentWeatherState = weatherStateBuilder.weatherStateFromFile(home.data.location.city.split(",")[0]);
    const updatedWeatherState = weatherStateBuilder.weatherStateFromHomematicHome(home);

    handleWeatherStateChange(currentWeatherState, updatedWeatherState);
};

/**
 * 
 * @param {GroupState} currentState 
 * @param {GroupState} updatedState
 * @returns 
 */
const handleGroupStateChange = (currentState, updatedState) => {
    const groupStateAnalyzer = new GroupStateAnlyzer(currentState, updatedState);

    if (groupStateAnalyzer.statesAreIdentical()) return;

    const dataSender = new GroupDataSender();
    dataSender.sendData(currentState, updatedState);

    const groupStateDB = new GroupStateDB();
    groupStateDB.save(updatedState);

    EventLogger.groupUpdateEvent(currentState, updatedState);
    EventLogger.groupUpdateEventToInflux(currentState, updatedState);
};

/**
 * @param {DeviceState} currentState
 * @param {DeviceState} updatedState
 * @returns
 */
const handleDeviceStateChange = (currentState, updatedState) => {
    const deviceStateAnalyzer = new DeviceStateAnalyzer(currentState, updatedState);
    const deviceStateDB = new DeviceStateDB();

    updatedState.channels
        .forEach(
            (updatedChannel) => {
                if (deviceStateAnalyzer.channelsAreIdentical(updatedChannel.index)) return;

                const dataSender = new DeviceDataSender();
                dataSender.sendChannelData(currentState, updatedState, updatedChannel.index);

                EventLogger.deviceUpdateEvent(currentState, updatedState, updatedChannel.index);
            }
        );

    deviceStateDB.save(updatedState);
};

/**
 * @param {WeatherState} currentState 
 * @param {WeatherState} updatedState
 * @returns 
 */
const handleWeatherStateChange = (currentState, updatedState) => {
    const weatherStateAnalyzer = new WeatherStateAnlyzer(currentState, updatedState);

    if (weatherStateAnalyzer.statesAreIdentical()) return;

    const dataSender = new WeatherDataSender();
    dataSender.sendData(currentState, updatedState);

    const weatherStateDB = new WeatherStateDB();
    weatherStateDB.save(updatedState);

    EventLogger.weatherUpdateEvent(currentState, updatedState);
};

module.exports = { startEventListener };