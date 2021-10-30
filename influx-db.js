const { InfluxDB } = require('@influxdata/influxdb-client');
const { Point } = require('@influxdata/influxdb-client');

class InfluxDBManager {
    org = process.env.INFLUX_ORG;

    influx;

    constructor() {
        this.influx = new InfluxDB({
            url: "http://" + process.env.INFLUX_HOST + ":" + process.env.INFLUX_PORT,
            token: process.env.INFLUX_TOKEN
        });
    }

    async sendThermostatInformation(group) {
        const currentTemp = group.actualTemperature;
        const currentHumidity = group.humidity;
        const setTemperature = group.setPointTemperature;

        const writeApi = this.influx.getWriteApi(this.org, "any");

        writeApi.useDefaultTags({});

        const point = new Point(group.label)
            .floatField('temperature', currentTemp)
            .floatField('humidity', currentHumidity)
            .floatField('setTemperature', setTemperature);

        writeApi.writePoint(point);

        writeApi
            .close()
            .then(() => {
            })
            .catch(e => {
                console.error(e);
                console.log('\\nFinished ERROR');
            });
    }

    async sendWeatherInformation(weather) {
        const currentTemp = weather.temperature;
        const currentHumidity = weather.humidity;

        const writeApi = this.influx.getWriteApi(this.org, "any");

        writeApi.useDefaultTags({});

        const point = new Point("Wetter")
            .floatField('temperature', currentTemp)
            .floatField('humidity', currentHumidity);

        writeApi.writePoint(point);

        writeApi
            .close()
            .then(() => {
            })
            .catch(e => {
                console.error(e);
                console.log('\\nFinished ERROR');
            });
    }

    async sendGenericInformation(data, bucket) {
        const writeApi = this.influx.getWriteApi(this.org, bucket);

        writeApi.useDefaultTags(data.tags ? data.tags : {});

        const point = new Point(data.label);

        const dataValues = data.values;
        const dataValueKeys = Object.keys(dataValues);

        dataValueKeys
            .forEach(
                dataValueKey => {
                    const value = dataValues[dataValueKey];
                    if (value) {
                        point.floatField(dataValueKey, dataValues[dataValueKey]);
                    }
                }
            );

        writeApi.writePoint(point);

        writeApi
            .close()
            .then(() => {
            })
            .catch(e => {
                console.error(e);
                console.log('\\nFinished ERROR');
            });
    }
}

module.exports = { InfluxDBManager };