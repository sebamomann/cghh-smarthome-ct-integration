const fs = require("fs");

const FILE_NAME = "./homematic_groups.json";

class HomematicGroupMapper {
    constructor() {
    }

    static getGroupNameById = (id) => {
        const data = fs.readFileSync(FILE_NAME, 'utf8');
        const json_data = JSON.parse(data);

        return json_data.groups.find(element => element.id === id)?.name;
    };

    static getGroupIdByName = (name) => {
        const data = fs.readFileSync(FILE_NAME, 'utf8');
        const json_data = JSON.parse(data);

        return json_data.groups.find(element => element.name === name)?.id;
    };
}

module.exports = { HomematicGroupMapper };