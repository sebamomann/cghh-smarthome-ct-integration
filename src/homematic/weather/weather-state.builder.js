const { WeatherState } = require("./weather-state");

const fs = require("fs");

const FILE_NAME = process.cwd() + "/persistent/states/weather.json";

class WeatherStateBuilder {
    constructor() {

    }

    weatherStateFromFile(weatherLocationId) {
        var dataRaw;

        try {
            dataRaw = fs.readFileSync(FILE_NAME, 'utf8');
        } catch (e) {
            dataRaw = "{}";
        }

        const json_data = JSON.parse(dataRaw);

        const weatherStateRaw = json_data[weatherLocationId];

        if (!weatherStateRaw) {
            return this.buildInitWeatherState();
        }

        const weatherState = new WeatherState();
        Object.assign(weatherState, weatherStateRaw);

        return weatherState;
    }

    weatherStateFromHomematicHome(home) {
        const weatherState = new WeatherState();

        weatherState.label = home.data.location.city.split(",")[0];

        weatherState.temperature = home.data.weather.temperature;
        weatherState.minTemperature = home.data.weather.minTemperature;
        weatherState.maxTemperature = home.data.weather.maxTemperature;
        weatherState.humidity = home.data.weather.humidity;
        weatherState.windSpeed = home.data.weather.windSpeed;
        weatherState.vaporAmount = home.data.weather.vaporAmount;

        weatherState.weatherCondition = home.data.weather.weatherCondition;
        weatherState.weatherDayTime = home.data.weather.weatherDayTime;

        return weatherState;
    }

    /**
     * @param {WeatherState} state 
     */
    weatherStateFromWeatherState(state) {
        return JSON.parse(JSON.stringify(state));
    }

    buildInitWeatherState() {
        const weatherState = new WeatherState();

        weatherState.label = "INIT";

        return weatherState;
    }
}

module.exports = { WeatherStateBuilder };