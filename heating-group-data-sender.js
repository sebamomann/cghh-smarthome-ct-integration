const { InfluxDBManager } = require("./influx-db");

class HeatingGroupDataSender {

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
    sendData(lastData, newData) {
        const isSetTemperatureChange = lastData.values.setTemperature !== newData.values.setTemperature;

        if (isSetTemperatureChange) {
            console.log("RESEND");
            const resendData = this.constructResendDataElement(lastData, newData);
            this.influxDB.sendGenericInformation(resendData, "group-heating");
            console.log(resendData);
        }

        console.log("SEND");
        console.log(newData);

        this.influxDB.sendGenericInformation(newData, "group-heating");
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

module.exports = { HeatingGroupDataSender };