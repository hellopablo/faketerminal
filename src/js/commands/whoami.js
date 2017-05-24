/**
 * The "whoami" command
 * @param  {Object} instance The instance of FakeTerminal
 * @return {Object}
 */
window.FakeTerminal.command.whoami = function (instance) {

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
            description: 'Prints the user\'s username to standard output'
        };
    };

    // --------------------------------------------------------------------------

    /**
     * This method is called when FakeTerminal encounters the command which this
     * class represents
     * @return {Object}
     */
    base.execute = function () {
        instance.output.write(instance.options.username);
        base.deferred.resolve();
        return base.deferred.promise();
    };

    // --------------------------------------------------------------------------

    return base;
};
