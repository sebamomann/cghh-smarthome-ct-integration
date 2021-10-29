const { InfluxDBManager } = require("./influx-db");
const { WSConnection: WebsocketManager } = require("./websocket-connection");
const fs = require('fs');

const influxDB = new InfluxDBManager();
const websocketManager = new WebsocketManager();

const startEventListener = () => {
    websocketManager.connect(callback);
};

const callback = (data) => {
    const bufferdata = data.toString("utf8");
    const json = JSON.parse(bufferdata);

    const events = json.events;

    const eventIds = Object.keys(events);

    eventIds
        .forEach(eventId => {
            const event = events[eventId];

            if (event.pushEventType === "GROUP_CHANGED") {
                handleGroupChangedEvent(event);
            } else if (event.pushEventType === "DEVICE_CHANGED") {
                handleDeviceChanged(event);
            } else if (event.pushEventType === "HOME_CHANGED") {
                handleHomeChangeEvent(event);
            }
        });
};

const handleGroupChangedEvent = (event) => {
    if (event.group?.type === "HEATING") {
        const groupLabel = event.group.label;
        const groupSetPointTemperature = event.group.setPointTemperature;
        const groupActualTemperature = event.group.actualTemperature;
        const groupHumidity = event.group.humidity;

        if (!groupActualTemperature) return; // e.g. Eingangsbereich is null due to not being wallthermostat

        const data = {
            label: groupLabel,
            values: {
                temperature: groupActualTemperature,
                setTemperature: groupSetPointTemperature,
                humidity: groupHumidity,
            }
        };

        const lastSent = getLastSentDataForGroup(groupLabel);

        // check and resent value set with last send setTemperature so there is a hard cut in the data for the field
        if (lastSent && lastSent.values.setTemperature !== data.values.setTemperature) {
            const resend = { ...data };
            resend.values.setTemperature = lastSent.values.setTemperature;

            influxDB.sendGenericInformation(resend);
        }

        influxDB.sendGenericInformation(data);

        setLastSent(data);

        console.log("[Event] " + groupLabel + " Set: " + groupSetPointTemperature + " Current: " + groupActualTemperature);
    }
};

const handleDeviceChanged = (event) => {
    if (event.device?.type === "HEATING_THERMOSTAT") {
        const functionalChannels = event.device.functionalChannels;
        const functionalChannelKeys = Object.keys(functionalChannels);

        functionalChannelKeys
            .forEach(functionalChannelKey => {
                const channel = functionalChannels[functionalChannelKey];

                const deviceLabel = event.device.label;
                const deviceSetPointTemperature = channel.setPointTemperature;
                const deviceActualValveTemperature = channel.valveActualTemperature;
                const deviceGroupId = channel.groups[0];

                const groupLabel = getGroupsLabelById(deviceGroupId);

                const data = {
                    label: groupLabel,
                    values: {
                        temperature: deviceActualValveTemperature,
                        setTemperature: deviceSetPointTemperature
                    }
                };

                const lastSent = getLastSentDataForGroup(groupLabel);

                // check and resent value set with last send setTemperature so there is a hard cut in the data for the field
                if (lastSent && lastSent.values.setTemperature !== data.values.setTemperature) {
                    const resend = { ...data };
                    resend.values.setTemperature = lastSent.values.setTemperature;

                    influxDB.sendGenericInformation(resend);
                }

                influxDB.sendGenericInformation(data);

                setLastSent(data);

                console.log("[EVENT] [*] " + deviceLabel + " Set: " + deviceSetPointTemperature + " Current: " + deviceActualValveTemperature + " GRPID: " + deviceGroupId);
            });

    }
};

const handleHomeChangeEvent = (event) => {
    const home = event.home;

    const temperature = home.weather.temperature;
    const humidity = home.weather.humidity;

    // TODO 
    // WHY IS IT UNDEFINED?
    if (!temperature) return;

    const data = {
        label: "Wetter",
        values: {
            temperature: temperature,
            humidity: humidity
        }
    };

    influxDB.sendGenericInformation(data);

    console.log("[Event] Wetter " + temperature + " " + humidity);
};

function getGroupsLabelById(id) {
    const data = fs.readFileSync("./homematic_groups.json", 'utf8');
    const json_data = JSON.parse(data);

    return json_data.groups.filter(element => element.id === id).label;
}

function getLastSentJsonObject() {
    const data = fs.readFileSync("./last_sent.json", 'utf8');

    return JSON.parse(data);
}

function getLastSentDataForGroup(label) {
    const json_data = getLastSentJsonObject();
    return json_data[label];
}

function setLastSent(data) {
    const label = data.label;

    const json_data = getLastSentJsonObject();
    json_data[label] = data;

    const jsonString = JSON.stringify(json_data, null, 2);

    fs.writeFileSync("./last_sent.json", jsonString, 'utf8');
}

module.exports = { startEventListener };
