const FILE_NAME = __dirname + "/config/";

/**
 * TODO
 */
class HomeState {

    state;

    constructor() {
        fetchStateFromFile();
    }

    fetchStateFromFile = () => {
        var dataRaw;
        try {
            dataRaw = fs.readFileSync(FILE_NAME, 'utf8');
        } catch (e) {
            dataRaw = {};
        }
        const json_data = JSON.parse(dataRaw);

        this.state = json_data;
    };

}

module.exports = { HomeState };