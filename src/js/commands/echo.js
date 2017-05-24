/**
 * The "echo" command
 * @param  {Object} instance The instance of fakeTerminal
 * @return {Object}
 */
window.FakeTerminal.command.echo = function (instance) {

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
            description: 'Writes an argument to the standard output'
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

        //  Wrote to the terminal
        base.write(returnVal);

        deferred.resolve();
        return deferred;
    };

    // --------------------------------------------------------------------------

    return base;
};
