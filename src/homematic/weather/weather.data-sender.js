const { InfluxDBManager } = require("../../influx/influx-db");
const { parseWeatherStateIntoInfluxDataObject } = require("../../util/homematic-influx.mapper");
const { WeatherState } = require("./weather-state");

class WeatherDataSender {

    influxDb;

    constructor() {
        this.influxDB = new InfluxDBManager();
    }

    /**
     * Send data to the specified influx database.
     * 
     * @param {WeatherState} currentState 
     * @param {WeatherState} updatedState 
     */
    async sendData(currentState, updatedState) {
        const resendWeatherStateInflux = parseWeatherStateIntoInfluxDataObject(updatedState);
        await this.influxDB.sendGenericInformation(resendWeatherStateInflux, "weather");
    }
}

module.exports = { WeatherDataSender };