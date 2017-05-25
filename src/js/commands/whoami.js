/**
 * The "whoami" command
 * @param  {window.FakeTerminal} instance The instance of FakeTerminal
 * @return {Object}
 */
window.FakeTerminal.command.whoami = function (instance) {

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
            description: 'Prints the user\'s username to standard output'
        };
    };

    // --------------------------------------------------------------------------

    /**
     * Executes the command
     * @return {Object} A promise which will be resolved when the command completes
     */
    base.execute = function () {
        instance.output.write(instance.options.username);
        base.deferred.resolve();
        return base.deferred.promise();
    };

    // --------------------------------------------------------------------------

    return base;
};
