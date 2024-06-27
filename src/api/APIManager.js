const Logger = require('../Logger.js');
const config = require('../../config.js');
const axios = require("axios");

let isActionRunning = false;

class APIManager {
    startLongpoll() {
        if (config.longpoll.enabled === false) return;

        setInterval(async ()=>{
            if(isActionRunning){
                return;
            }

            let request_url = `${config.longpoll.provider}?method=getRequests&api=${config.minecraft.API.SCF.key}`;

            isActionRunning = true;

            try{
                let actions = await axios.get(request_url);
                console.log(actions);
            }
            catch(e){
                console.log(e);
            }
        }, 5000);
    }
}

module.exports = APIManager;
