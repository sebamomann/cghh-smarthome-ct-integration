const { InfluxDBManager } = require("./influx-db");

class WeatherDataSender {

    influxDb;

    constructor() {
        this.influxDB = new InfluxDBManager();
    }

    /**
     * Send data to the specified influx database.
     * 
     * @param {*} lastData 
     * @param {*} newData 
     */
    async sendData(lastData, newData) {
        await  this.influxDB.sendGenericInformation(newData, "weather");
    }
}

module.exports = { WeatherDataSender };