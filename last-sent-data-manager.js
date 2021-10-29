const fs = require("fs");

const FILE_NAME = "./last_sent.json";

class LastSentDataManager {

    newData;
    lastData;

    constructor(data) {
        this.newData = data;
        this.fetchLastSendDataOfGroup();
    }

    fetchLastSendDataOfGroup = () => {
        const data = this.getLastSentDataOfGroupFromFile();
        if (!data) {
            const tmpData = JSON.parse(JSON.stringify(this.newData));
            tmpData.label = tmpData.label + " INIT";
            this.lastData = tmpData;
            return;
        }

        this.lastData = data;
    };

    lastSentDataIsStillCorrect = () => {
        return JSON.stringify(this.newData) === JSON.stringify(this.lastData);
    };

    getLastSentJsonObject = () => {
        const data = fs.readFileSync(FILE_NAME, 'utf8');
        return JSON.parse(data);
    };

    getLastSentDataOfGroupFromFile = () => {
        const json_data = this.getLastSentJsonObject();
        return json_data[this.newData.label];
    };

    updateLastSent = () => {
        const label = this.newData.label;

        const json_data = this.getLastSentJsonObject();
        json_data[label] = this.newData;

        const jsonString = JSON.stringify(json_data, null, 2);

        fs.writeFileSync(FILE_NAME, jsonString, 'utf8');
    };
}

module.exports = { LastSentDataManager };