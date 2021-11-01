const fs = require("fs");

const FILE_NAME = __dirname + "/config/homematic-groups.json";

class HomematicGroupMapper {
    constructor() {
    }

    static getGroupNameById = (id) => {
        var dataRaw;
        try {
            dataRaw = fs.readFileSync(FILE_NAME, 'utf8');
        } catch (e) {
            dataRaw = {};
        }
        const json_data = JSON.parse(dataRaw);

        return json_data.groups.find(element => element.id === id)?.name;
    };

    static getGroupIdByName = (name) => {
        var dataRaw;
        try {
            dataRaw = fs.readFileSync(FILE_NAME, 'utf8');
        } catch (e) {
            dataRaw = {};
        }
        const json_data = JSON.parse(dataRaw);

        return json_data.groups.find(element => element.name === name)?.id;
    };
}

module.exports = { HomematicGroupMapper };