/**
 * The base command object, commands should extend this object
 * @return {Object}
 */
window.FakeTerminal.command._base = function (instance) {

    /**
     * To avoid scope issues, use 'base' instead of 'this' to reference
     * this class from internal events and functions.
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
     * @param  {Array} userArgs An array of arguments passed by the user
     * @return {Object}          An array of lines to render to the screen
     */
    base.execute = function (userArgs) {
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
