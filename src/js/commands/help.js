/**
 * The "help" command
 * @param  {Object} instance The instance of fakeTerminal
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
     * This method is called when fake terminal encounters the command which this
     * class represents
     * @param  {Array} userArgs An array of arguments passed by the user
     * @return {Object}
     */
    base.execute = function (userArgs) {

        var deferred = new $.Deferred();
        var returnVal   = [];
        var commandInfo = {};
        var temp;

        if (userArgs.length === 0) {

            returnVal.push('The following commands are available, run <span class="ft-info">help [command]</span> to find out more.');
            returnVal.push(' ');

            var commandString = '';
            $.each(window.FakeTerminal.command, function (command, value) {
                var temp = new window.FakeTerminal.command[command](instance);

                //  Check to see if the command is private
                if (typeof(temp.info) == 'function') {

                    commandInfo = temp.info();

                    if (typeof(commandInfo.private) == 'boolean' && commandInfo.private === true) {
                        return;
                    }
                }

                commandString += command + '    ';
            });

            returnVal.push(commandString);
            returnVal.push(' ');

        } else {

            var command        = userArgs[0];
            var isValidCommand = false;

            $.each(window.FakeTerminal.command, function (index, value) {
                if (index === command) {
                    isValidCommand = true;
                }
            });

            if (isValidCommand) {

                temp = new window.FakeTerminal.command[command](instance);

                if (typeof(temp.info) == 'function') {

                    commandInfo = temp.info();

                    if (typeof(commandInfo.description) === 'string') {
                        returnVal = [' ', command + ' -- ' + commandInfo.description, ' '];
                    } else if (typeof(commandInfo.description) === 'object') {
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
            base.write(returnVal[i]);
        }

        deferred.resolve();
        return deferred;
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
