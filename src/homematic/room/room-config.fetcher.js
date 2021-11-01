var fs = require('fs');
const { RoomConfiguration } = require('./room-config');

const FILE_NAME = process.cwd() + "/config/room.config.json";

class RoomConfigurationFetcher {

    state;

    constructor() {
        var dataRaw;
        try {
            dataRaw = fs.readFileSync(FILE_NAME, 'utf8');
        } catch (e) {
            dataRaw = "{}";
        }
        this.state = JSON.parse(dataRaw);
    }

    /**
     * @param {RoomConfiguration} roomId 
     * @returns 
     */
    getRoomConfigurationById(roomId) {
        const rooms = this.state.rooms;
        const roomRaw = rooms.find(room => room.id === roomId);

        if (!roomRaw) throw new Error("Room does not exist in HMIP");

        const roomConfiguration = new RoomConfiguration();
        roomConfiguration.populateFields(roomRaw);

        return roomConfiguration;
    }

    /**
     * @param {*} roomName 
     * @returns  {RoomConfiguration}
     */
    getRoomConfigurationByHomematicName(roomName) {
        const rooms = this.state.rooms;
        const roomRaw = rooms.find(room => room.homematicName === roomName);

        if (!roomRaw) throw new Error("Room does not exist in HMIP");

        const roomConfiguration = new RoomConfiguration();
        roomConfiguration.populateFields(roomRaw);

        return roomConfiguration;
    }

    getRoomConfigurationByHomematicId(roomId) {
        const rooms = this.state.rooms;
        const roomRaw = rooms.find(room => room.homematicId === roomId);

        if (!roomRaw) throw new Error("Room does not exist in HMIP");

        const roomConfiguration = new RoomConfiguration();
        roomConfiguration.populateFields(roomRaw);

        return roomConfiguration;
    }
}

module.exports = { RoomConfigurationFetcher };