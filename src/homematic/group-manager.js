const { HomematicApi } = require("./homematic-api");

class HomematicElementManager {

    homematicAPI;

    constructor() {
        this.homematicAPI = new HomematicApi();
    }

}

module.exports = { HomematicElementManager };