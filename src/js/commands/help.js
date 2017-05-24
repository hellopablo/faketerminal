/**
 * The "help" command
 * @param  {Object} instance The instance of FakeTerminal
 * @return {Object}
 */
window.FakeTerminal.command.help = function (instance) {

    //  Extend the base command
    window.FakeTerminal.command._base.apply(this, arguments);

    /**
     * To avoid scope issues, use 'base' instead of 'this' to reference
     * this class from internal events and functions.
     */
    var base = this;

    // --------------------------------------------------------------------------

    /**
     * Describes the command
     * @return {Object}
     */
    base.info = function () {
        return {
            description: 'Displays information about the available commands'
        };
    };

    // --------------------------------------------------------------------------

    /**
     * This method is called when FakeTerminal encounters the command which this
     * class represents
     * @return {Object}
     */
    base.execute = function () {

        var returnVal   = [];
        var commandInfo = {};

        if (arguments.length === 0) {

            returnVal.push('The following commands are available, run <info>help [command]</info> to find out more.');
            returnVal.push(' ');

            var commandString = '';
            $.each(window.FakeTerminal.command, function (command) {

                var temp = instance.findCommand(command);
                if (!temp) {
                    return;
                }

                //  Check to see if the command is private
                if (typeof temp.info === 'function') {
                    commandInfo = temp.info();
                    if (typeof commandInfo.private === 'boolean' && commandInfo.private === true) {
                        return;
                    }
                }

                commandString += command + '    ';
            });

            returnVal.push(commandString);
            returnVal.push(' ');

        } else {

            var command = instance.findCommand(arguments[0]);
            if (command) {

                if (typeof command.info === 'function') {

                    commandInfo = command.info();

                    if (typeof commandInfo.description === 'string') {
                        returnVal = [' ', arguments[0] + ' -- <comment>' + commandInfo.description + '</comment>', ' '];
                    } else if (typeof commandInfo.description === 'object') {
                        returnVal = commandInfo.description;
                    }
                }

                if (returnVal.length === 0) {
                    returnVal = [' ', 'No description for "' + command + '"', ' '];
                }

            } else {
                returnVal = [' ', '"' + command + '" is not a valid command', ' '];
            }
        }

        //  Write to the terminal
        for (var i = 0; i < returnVal.length; i++) {
            instance.output.write(returnVal[i]);
        }

        base.deferred.resolve();
        return base.deferred.promise();
    };

    // --------------------------------------------------------------------------

    return base;
};

// --------------------------------------------------------------------------

/**
 * The "man" command, an alias of "help"
 * @return {Object}
 */
window.FakeTerminal.command.man = function () {
    window.FakeTerminal.command.help.apply(this, arguments);
    return this;
};
