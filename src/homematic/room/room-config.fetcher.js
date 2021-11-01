var fs = require('fs');
const { RoomConfiguration } = require('./room-config.class');

const FILE_NAME = __dirname + "/config/room.config.json";

class RoomConfigurationFetcher {

    state;

    constructor() {
        var dataRaw;
        try {
            dataRaw = fs.readFileSync(FILE_NAME, 'utf8');
        } catch (e) {
            dataRaw = {};
        }
        this.state = JSON.parse(dataRaw);
    }

    getRoomConfigurationById(roomId) {
        const rooms = this.state.rooms;
        const roomRaw = rooms.find(room => room.id === roomId);

        if (!roomRaw) throw new Error("Room does not exist in HMIP");

        const roomConfiguration = new RoomConfiguration();
        roomConfiguration.populateFields(roomRaw);

        return roomConfiguration;
    }

    getRoomConfigurationByHomematicName(roomName) {
        const rooms = this.state.rooms;
        const roomRaw = rooms.find(room => room.homematicName === roomName);

        if (!roomRaw) throw new Error("Room does not exist in HMIP");

        const roomConfiguration = new RoomConfiguration();
        roomConfiguration.populateFields(roomRaw);

        return roomConfiguration;
    }
}

module.exports = { RoomConfigurationFetcher };