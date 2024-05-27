const { formatNumber } = require('../../contracts/helperFunctions.js');
const minecraftCommand = require('../../contracts/minecraftCommand.js');
const mathjs = require('mathjs');

class CalculateCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'calculate';
        this.aliases = ['calc', 'math'];
        this.description = 'Evaluate math expression.';
        this.options = [
            {
                name: 'expression',
                description: 'Any kind of math equation',
                required: true
            }
        ];
    }

    onCommand(username, message, channel = 'gc') {
        try {
            let data = message.toString().split(' ');
            data.shift();
            let task = data.join(' ');

            const answer = mathjs.evaluate(task ?? '').toString();

            if (parseFloat(answer) != NaN) {
                this.send(`/${channel} ${username}, the answer is '${parseFloat(answer)}'`);
            } else {
                this.send(`/${channel} [ERROR] The expression cannot be evaluated.`);
            }
        } catch (error) {
            this.send(`/${channel} [ERROR] The expression cannot be evaluated.`);
        }
    }
}

module.exports = CalculateCommand;
