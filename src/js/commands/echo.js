/**
 * The "echo" command
 * @param  {window.FakeTerminal} instance The instance of FakeTerminal
 * @return {Object}
 */
window.FakeTerminal.command.echo = function (instance) {

    //  Extend the base command
    window.FakeTerminal.command.apply(this, arguments);

    /**
     * Avoid scope issues by using `base` instead of `this`
     * @type {Object}
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
     * Executes the command
     * @return {Object} A promise which will be resolved when the command completes
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
