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
     * The "history" command
     * @param  {Object} instance The instance of fakeTerminal
     * @return {Object}
     */
    $.fakeTerminal.command.history = function(instance) {

        //  Extend the base command
        $.fakeTerminal.command._base.apply(this, arguments);

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
                description: 'Displays the command history, up to ' + instance.options.historyLength + ' items'
            };
        };

        // --------------------------------------------------------------------------

        /**
         * This method is called when fake terminal encounters the command which this
         * class represents
         * @param  {array} userArgs An array of arguments passed by the user
         * @return {Object}
         */
        base.execute = function(userArgs) {

            instance.addLine('  ');

            for (var i = 0; i < instance.history.length; i++) {

                instance.addLine(i + '  ' + instance.history[i]);
            }

            instance.addLine('  ');

            //  Cleanly exit
            base.exit(0);

            return base;
        };

        // --------------------------------------------------------------------------

        return base;
    };

})(jQuery);