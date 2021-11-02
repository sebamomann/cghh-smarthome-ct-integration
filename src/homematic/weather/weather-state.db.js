const fs = require("fs");
const fse = require("fs-extra");

const FILE_NAME = process.cwd() + "/persistent/states/weather.json";

class WeatherStateDB {

    constructor() {

    }

    /**
     * @param {WeatherState} state 
     */
    save = (state) => {
        const json_data = this.getFileContent();

        const data = {
            label: state.label,
            temperature: state.temperature,
            minTemperature: state.minTemperature,
            maxTemperature: state.maxTemperature,
            humidity: state.humidity,
            windSpeed: state.windSpeed,
            vaporAmount: state.vaporAmount,
            weatherCondition: state.weatherCondition,
            weatherDayTime: state.weatherDayTime
        };

        json_data[state.id] = data;

        fse.outputFileSync(FILE_NAME, JSON.stringify(json_data, null, 2));
    };

    getFileContent = () => {
        var dataRaw;

        try {
            dataRaw = fs.readFileSync(FILE_NAME, 'utf8');
        } catch (e) {
            dataRaw = "{}";
        }

        return JSON.parse(dataRaw);
    };
}

module.exports = { WeatherStateDB };