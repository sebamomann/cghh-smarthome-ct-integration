const { InfluxDBManager } = require("./influx-db");

/**
 * TODO
 * Zusammenfassen? 
 * --> Vererbung?
 */
class HeatingThermostatDataSender {

    influxDb;

    constructor() {
        this.influxDB = new InfluxDBManager();
    }

    /**
     * Send data to the specified influx database.
     * Before sending the updated data, check if the set temperature is changed.
     * If so, resend this set temperature before the new data. This causes a aprupt change in the db visualization of setTemperature.
     * Otherwise a slow rise in the setTemperature would be interpreted.
     * 
     * @param {*} lastData 
     * @param {*} newData 
     */
    async sendData(lastData, newData) {
        const isSetTemperatureChange = lastData.values.setTemperature !== newData.values.setTemperature;

        if (isSetTemperatureChange) {
            console.log("RESEND");
            const resendData = this.constructResendDataElement(lastData, newData);
            await this.influxDB.sendGenericInformation(resendData, "device-heating-thermostat");
            console.log(resendData);
        }

        console.log("SEND");
        console.log(newData);
        await this.influxDB.sendGenericInformation(newData, "device-heating-thermostat");
    }

    /**
     * Construct an object, that does contain all new information, except the set temperatrue
     * Set temeprature values gets overridden by last send set temperature value
     * 
     * @param {*} lastData
     * @param {*} newData
     */
    constructResendDataElement(lastData, newData) {
        const resend = JSON.parse(JSON.stringify(newData)); // deep copy new data object
        resend.values.setTemperature = lastData.values.setTemperature;

        return resend;
    }
}

module.exports = { HeatingThermostatDataSender };