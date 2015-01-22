(function($){

    if(!$.shed){
        $.shed = new Object();
    };

    if(!$.shed.fakeTerminalCommand){
        $.shed.fakeTerminalCommand = new Object();
    };

    $.shed.fakeTerminalCommand.help = function()
    {
        /**
         * To avoid scope issues, use 'base' instead of 'this' to reference
         * this class from internal events and functions.
         */

        var base = this;

        // --------------------------------------------------------------------------

        //  field variables
        base.counter = 0;

        // --------------------------------------------------------------------------

        /**
         * Describes the command
         * @return {Object}
         */
        base.info = function()
        {
            return {
                description: 'Displays information about the available commands'
            }
        }

        // --------------------------------------------------------------------------

        /**
         * This method is called when fake terminal encounters the command which this class represents
         * @param  {array}  arguments An array of arguments passed by the user
         * @return {array}            An array of lines to render to the screen
         */
        base.execute = function(arguments) {

            var returnVal = [];

            if (arguments.length === 0) {

                returnVal.push('The following commands are available, run <span class="ft-comment">help [command]</span> to find out more.');
                returnVal.push(' ');

                var commandString = '';
                $.each($.shed.fakeTerminalCommand, function(index, value)
                {
                    commandString += index + '    '
                });

                returnVal.push(commandString);
                returnVal.push(' ');

            } else {

                var command        = arguments[0];
                var isValidCommand = false;

                $.each($.shed.fakeTerminalCommand, function(index, value) {

                    if (index === command) {

                        isValidCommand = true;
                    }
                });


                if (isValidCommand) {


                    var temp = new $.shed.fakeTerminalCommand[command]();
                    if (typeof(temp.info) == 'function') {

                        var info = temp.info();

                        if (typeof(info.description) == 'string') {

                            returnVal = [' ', command + ' -- ' + info.description, ' '];

                        } else if (typeof(info.description) == 'array') {

                            returnVal = info.description;
                        }
                    }

                    if (returnVal.length === 0) {

                        returnVal = [' ', 'No description for "' + command + '"', ' '];
                    }

                } else {

                    returnVal = [' ', '"' + command + '" is not a valid command', ' '];
                }
            }

            return returnVal;
        };
    };

})(jQuery);