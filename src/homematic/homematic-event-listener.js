const { WebsocketManager } = require("../websocket-manager");

const { parseHomeWeatherDataIntoInfluxDataObject } = require("../util/homematic-influx.mapper");

const { Group } = require("./group/group");
const { GroupState } = require("./group/group-state");
const { GroupStateBuilder } = require("./group/group-state.builder");
const { GroupStateAnlyzer } = require("./group/group-state.analyzer");
const { GroupDataSender } = require("./group/group.data-sender");

const { Device } = require("./device/device");
const { DeviceState } = require("./device/device-state");
const { DeviceStateBuilder } = require("./device/device-state.builder");
const { DeviceStateAnalyzer } = require("./device/device-state.analyzer");
const { DeviceDataSender } = require("./device/device.data-sender");

const { WeatherDataSender } = require("./weather/weather.data-sender");

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

    const currentGroupState = groupStateBuilder.groupStateFromFile(group.data.id);
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
    const updatedDeviceState = deviceStateBuilder.deviceStateFromGroup(device);

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
    const raw_home = event.home;

    if (!raw_home) return;

    const data = parseHomeWeatherDataIntoInfluxDataObject(raw_home);
    sendWeatherData(data);
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

    updatedState.save();

    console.log("[" + moment() + "] [Event] [GROUP UPDATE] [FROM] " + currentState.label + " Set: " + currentState.setTemperature?.toFixed(1) + " Current: " + currentState.temperature?.toFixed(1) + " Hum: " + currentState.humidity?.toFixed(1));
    console.log("[" + moment() + "] [Event] [GROUP UPDATE] [TOOO] " + updatedState.label + " Set: " + updatedState.setTemperature?.toFixed(1) + " Current: " + updatedState.temperature?.toFixed(1) + " Hum: " + updatedState.humidity?.toFixed(1));
};

/**
 *
 * @param {DeviceState} currentState
 * @param {DeviceState} updatedState
 * @returns
 */
const handleDeviceStateChange = (currentState, updatedState) => {
    const deviceStateAnalyzer = new DeviceStateAnalyzer(currentState, updatedState);

    updatedState.channels
        .forEach(
            (updatedChannel) => {
                if (!deviceStateAnalyzer.channelsAreIdentical(updatedChannel.index)) {
                    const dataSender = new DeviceDataSender();
                    dataSender.sendChannelData(currentState, updatedState, updatedChannel.index);

                    const currentChannel = currentState.channels[updatedChannel.index];

                    console.log("[" + moment() + "] [Event] [GROUP UPDATE] [FROM] " + currentState.label + " Set: " + currentChannel.setTemperature?.toFixed(1) + " Current: " + currentChannel.temperature?.toFixed(1) + " Valve: " + currentChannel.valvePosition?.toFixed(2) + " Channel: " + currentChannel.index);
                    console.log("[" + moment() + "] [Event] [GROUP UPDATE] [TOOO] " + updatedState.label + " Set: " + updatedChannel.setTemperature?.toFixed(1) + " Current: " + updatedChannel.temperature?.toFixed(1) + " Valve: " + updatedChannel.valvePosition?.toFixed(2) + " Channel: " + updatedChannel.index);
                }
            }
        );

    updatedState.save();
};

/**
 * Check if weather data changed.
 * Initialize data send.
 * Log event.
 *
 * @param {*} data
 */
const sendWeatherData = (data) => {
    // TODO
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

startEventListener();

module.exports = { startEventListener };