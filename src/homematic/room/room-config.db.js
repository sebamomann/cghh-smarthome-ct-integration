var fs = require('fs');
const { outputFileSync } = require('fs-extra');
const { RoomConfiguration } = require('./room-config');

const FILE_NAME = process.cwd() + "/config/room.config.json";

class RoomConfigurationDB {

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
     * @returns {RoomConfiguration[]}
     */
    getAll() {
        const rooms = this.state.rooms;

        const output = [];

        rooms.forEach(roomRaw => {
            const roomConfiguration = new RoomConfiguration();
            roomConfiguration.populateFields(roomRaw);

            output.push(roomConfiguration);
        });

        return output;
    }

    /**
     * @param   {String} ct_roomId 
     * @returns {RoomConfiguration}
     */
    getByChurchtoolsId(ct_roomId) {
        const rooms = this.state.rooms;
        const roomRaw = rooms.find(room => room.id === ct_roomId);

        if (!roomRaw) throw new Error("Room does not exist in HMIP. CT_RoomId: " + ct_roomId);

        const roomConfiguration = new RoomConfiguration();
        roomConfiguration.populateFields(roomRaw);

        return roomConfiguration;
    }

    /**
     * @param   {String} roomName 
     * @returns {RoomConfiguration}
     */
    getByHomematicName(roomName) {
        const rooms = this.state.rooms;
        const roomRaw = rooms.find(room => room.homematicName === roomName);

        if (!roomRaw) throw new Error("Room does not exist in HMIP. HMIP_GroupName: " + roomName);

        const roomConfiguration = new RoomConfiguration();
        roomConfiguration.populateFields(roomRaw);

        return roomConfiguration;
    }

    /**
     * @param   {string} roomId
     * @returns {RoomConfiguration}
     */
    getByHomematicId(roomId) {
        const rooms = this.state.rooms;
        const roomRaw = rooms.find(room => room.homematicId === roomId);

        if (!roomRaw) throw new Error("Room does not exist in HMIP. HMIP_GroupID: " + roomId);

        const roomConfiguration = new RoomConfiguration();
        roomConfiguration.populateFields(roomRaw);

        return roomConfiguration;
    }
}

module.exports = { RoomConfigurationDB };