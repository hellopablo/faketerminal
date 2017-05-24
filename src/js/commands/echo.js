/**
 * The "echo" command
 * @param  {Object} instance The instance of FakeTerminal
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
     * This method is called when FakeTerminal encounters the command which this
     * class represents
     * @return {Object}
     */
    base.execute = function () {

        var args = $.makeArray(arguments);
        var returnVal;

        //  Merge all the arguments
        returnVal = args.join(' ');
        returnVal = $.trim(returnVal);

        //  Remove quotes
        returnVal = returnVal.replace(/["']/g, '');
        returnVal = returnVal.replace(/["']/g, '');

        //  Ensure we write *something* to the screen
        if (returnVal.length === 0) {
            returnVal = ' ';
        }

        //  Write to the terminal
        instance.output.write(returnVal);

        base.deferred.resolve();
        return base.deferred.promise();
    };

    // --------------------------------------------------------------------------

    return base;
};
