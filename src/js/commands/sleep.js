/**
 * The "sleep" command
 * @param  {Object} instance The instance of fakeTerminal
 * @return {Object}
 */
window.FakeTerminal.command.sleep = function (instance) {

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
            description: 'Does nothing for a short while'
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
        var duration = 0;
        if (userArgs.length) {
            duration = parseInt(userArgs[0]);
        }
        setTimeout(function() {
            deferred.resolve();
        }, duration * 1000);

        return deferred;
    };

    // --------------------------------------------------------------------------

    return base;
};
