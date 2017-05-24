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
     * Writes a new line to the console
     * @param (String} line The line to write
     * @returns {Window.FakeTerminal.command}
     */
    base.write = function (line) {
        instance.addLine(line);
        return base;
    };

    // --------------------------------------------------------------------------

    /**
     * This method is called when fake terminal encounters the command which this class represents
     * @param  {Array} userArgs An array of arguments passed by the user
     * @return {Object}          An array of lines to render to the screen
     */
    base.execute = function (userArgs) {
        var deferred = new $.Deferred();
        return deferred;
    };
};
