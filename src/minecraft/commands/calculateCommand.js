const { formatNumber } = require("../../contracts/helperFunctions.js");
const minecraftCommand = require("../../contracts/minecraftCommand.js");
const mathjs = require('mathjs');

class CalculateCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = "calculate";
        this.aliases = ["calc", "math"];
        this.description = "Evaluate math expression.";
        this.options = [
            {
                name: "expression",
                description: "Any kind of math equation",
                required: true,
            },
        ];
    }

    onCommand(username, message, channel = "gc") {
        try {
            let data = message.toString().split(" ");
            data.shift();
            let task = data.join(' ');

            console.log(task);

            const answer = mathjs.evaluate(task ?? "").toString();

            console.log(answer);
            console.log(parseInt(answer));

            if(parseInt(answer) == NaN){
                throw "Wrong response";
            }

            this.send(`/${channel} ${username}, the answer is '${answer}'`);
        } catch (error) {
            this.send(`/${channel} [ERROR] The expression cannot be evaluated.`);
        }
    }
}

module.exports = CalculateCommand;