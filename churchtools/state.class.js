var fs = require('fs');

class State {

    FILE_NAME = "./churchtools/state.json";
    state = {};

    constructor() {
        const data = fs.readFileSync(this.FILE_NAME, 'utf8');
        this.state = JSON.parse(data);
    }

    writeToFile() {
        const json = JSON.stringify(this.state, null, 4);
        fs.writeFileSync(this.FILE_NAME, json, 'utf8');
    }

    getRoomById(roomId) {
        const rooms = this.state.rooms;
        const output = rooms.find(room => room.id === roomId);

        return output;
    }

    updateRoom(room) {
        // 
    }
}

module.exports = { State };