(function($) {

    //  Create namespace if not already created
    if(!$.fakeTerminal) {

        $.fakeTerminal = {};
    }

    //  Create command namespace if not already created
    if(!$.fakeTerminal.command) {

        $.fakeTerminal.command = {};
    }

    // --------------------------------------------------------------------------

    /**
     * The "echo" command
     * @param  {Object} instance The instance of fakeTerminal
     * @return {Object}
     */
    $.fakeTerminal.command.echo = function(instance) {

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
        base.info = function() {

            return {
                description: 'Writes an argument to the standard output'
            };
        };

        // --------------------------------------------------------------------------

        /**
         * This method is called when fake terminal encounters the command which this class represents
         * @param  {array} userArgs An array of arguments passed by the user
         * @return {Object}
         */
        base.execute = function(userArgs) {

            var returnVal;

            //  Merge all the arguments
            returnVal = userArgs.join(' ');
            returnVal = $.trim(returnVal);

            //  Remove quotes
            returnVal = returnVal.replace(/["']/g, '');
            returnVal = returnVal.replace(/["']/g, '');

            //  Ensure we write *something* to the screen
            if (returnVal.length === 0) {

                returnVal = ' ';
            }

            instance.addLine(returnVal);

            return base;
        };

        // --------------------------------------------------------------------------

        return base;
    };

})(jQuery);