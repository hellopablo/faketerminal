(function($){

    if(!$.shed){
        $.shed = new Object();
    };

    if(!$.shed.fakeTerminalCommand){
        $.shed.fakeTerminalCommand = new Object();
    };

    $.shed.fakeTerminalCommand.echo = function()
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
                description: 'Writes an argument to the standard output'
            }
        }

        // --------------------------------------------------------------------------

        /**
         * This method is called when fake terminal encounters the command which this class represents
         * @param  {array} arguments An array of arguments passed by the user
         * @return {array}           An array of lines to render to the screen
         */
        base.execute = function(arguments) {

            var returnVal;

            //  Merge all the arguments
            returnVal = arguments.join(' ');

            //  Remove quotes
            returnVal = returnVal.replace(/["']/g, '');
            returnVal = returnVal.replace(/["']/g, '');

            return returnVal;
        };
    };

})(jQuery);