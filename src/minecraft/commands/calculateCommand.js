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
            console.log(mathjs.evaluate(message));
            //const answer = mathjs.format(, { precision: 3 }).toString();


            //this.send(`/${channel} ${username}, the answer is '${answer}'`);
        } catch (error) {
            console.log(error);
            this.send(`/${channel} [ERROR] The expression cannot be evaluated.`);
        }
    }
}

module.exports = CalculateCommand;