/**
 * The base command object, commands should extend this object
 * @return {Object}
 */
window.FakeTerminal.command = function (instance) {

    /**
     * Avoid scope issues by using `base` instead of `this`
     * @type {Object}
     */
    var base = this;

    // --------------------------------------------------------------------------

    /**
     * The commands main deferred object; this is resolved or rejected when the
     * command completes
     * @type {$.Deferred}
     */
    base.deferred = new $.Deferred();

    // --------------------------------------------------------------------------

    /**
     * Describes the command
     * @return {Object}
     */
    base.info = function () {
        return {
            'private': true
        };
    };

    // --------------------------------------------------------------------------

    /**
     * This method is called when fake terminal encounters the command which this class represents
     * @return {Object} A promise which will be resolved when the command completes
     */
    base.execute = function () {
        base.deferred.resolve();
        return base.deferred.promise();
    };

    // --------------------------------------------------------------------------

    /**
     * Called if the command is terminated with CTL+C; useful for cleaning up
     */
    base.terminate = function() {
        base.deferred.reject();
    };
};
