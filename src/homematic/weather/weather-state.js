const fs = require("fs");
const fse = require("fs-extra");

const FILE_NAME = process.cwd() + "/persistent/states/weather.json";

class WeatherState {

    label;

    temperature;
    minTemperature;
    maxTemperature;
    humidity;
    windSpeed;
    vaporAmount;

    weatherCondition;
    weatherDayTime;

    /**
     * @type {expiring: string, eventName: string}
     */
    lock;

    constructor() { }

    async save() {
        var dataRaw;

        try {
            dataRaw = fs.readFileSync(FILE_NAME, 'utf8');
        } catch (e) {
            dataRaw = "{}";
        }

        const json_data = JSON.parse(dataRaw);

        const data = {
            label: this.label,
            temperature: this.temperature,
            minTemperature: this.minTemperature,
            maxTemperature: this.maxTemperature,
            humidity: this.humidity,
            windSpeed: this.windSpeed,
            vaporAmount: this.vaporAmount,
            weatherCondition: this.weatherCondition,
            weatherDayTime: this.weatherDayTime
        };

        json_data[this.label] = data;

        fse.outputFileSync(FILE_NAME, JSON.stringify(json_data, null, 2));
    }
}

module.exports = { WeatherState };