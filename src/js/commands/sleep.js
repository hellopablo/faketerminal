/**
 * The "sleep" command
 * @param  {window.FakeTerminal} instance The instance of FakeTerminal
 * @return {Object}
 */
window.FakeTerminal.command.sleep = function (instance) {

    //  Extend the base command
    window.FakeTerminal.command.apply(this, arguments);

    /**
     * Avoid scope issues by using `base` instead of `this`
     * @type {Object}
     */
    var base = this;

    // --------------------------------------------------------------------------

    base.timeout = null;

    // --------------------------------------------------------------------------

    /**
     * Describes the command
     * @return {Object}
     */
    base.info = function () {
        return {
            description: 'Does nothing for a short while'
        };
    };

    // --------------------------------------------------------------------------

    /**
     * Executes the command
     * @return {Object} A promise which will be resolved when the command completes
     */
    base.execute = function () {

        var duration = 0;
        if (arguments.length) {
            duration = parseInt(arguments[0]);
        }
        instance.output.write('Sleeping for ' + duration + ' seconds...');
        base.timeout = setTimeout(function() {
            instance.output.write('awake!');
            base.deferred.resolve();
        }, duration * 1000);

        return base.deferred.promise();
    };

    // --------------------------------------------------------------------------


    /**
     * Called if the command is terminated with CTL+C; useful for cleaning up
     */
    base.terminate = function() {
        clearTimeout(base.timeout);
        base.deferred.reject();
    };

    // --------------------------------------------------------------------------

    return base;
};
