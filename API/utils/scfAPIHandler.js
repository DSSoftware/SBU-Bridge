async function SCFhandleLeave(uuid) {
    return new Promise(async (resolve, reject) => {
        if (!config.API.SCF.enabled) {
            resolve(true);
            return;
        }

        try{
            await config.SCF.API.longpoll.create("userLeave", "scf_management", {
                version: 1,
                uuid: uuid,
            })
            resolve(true);
            return;
        }
        catch(e){
            console.log(e);
            resolve(false);
            return;
        }
    });
}

module.exports = {
    handleLeave: SCFhandleLeave,
};
