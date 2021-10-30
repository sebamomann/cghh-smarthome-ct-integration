var fs = require('fs');
const { RoomConfiguration } = require('./room-config.class');

const FILE_NAME = __dirname + "/room.config.json";

class RoomConfigurationFetcher {

    state;

    constructor() {
        const data = fs.readFileSync(FILE_NAME, 'utf8');
        this.state = JSON.parse(data);
    }

    getRoomConfigurationById(roomId) {
        const rooms = this.state.rooms;
        const roomRaw = rooms.find(room => room.id === roomId);

        if (!roomRaw) throw new Error("Room does not exist in HMIP");

        const roomConfiguration = new RoomConfiguration();
        roomConfiguration.populateFields(roomRaw);

        return roomConfiguration;
    }
}

module.exports = { RoomConfigurationFetcher };