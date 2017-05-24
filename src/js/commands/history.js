/**
 * The "history" command
 * @param  {Object} instance The instance of FakeTerminal
 * @return {Object}
 */
window.FakeTerminal.command.history = function (instance) {

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
            description: 'Displays the command history, up to ' + instance.options.historyLength + ' items'
        };
    };

    // --------------------------------------------------------------------------

    /**
     * This method is called when FakeTerminal encounters the command which this
     * class represents
     * @return {Object}
     */
    base.execute = function () {

        instance.output.write('  ');

        for (var i = 0; i < instance.history.items.length; i++) {
            instance.output.write(
                instance.history.items[i].counter + '  ' + instance.history.items[i].command
            );
        }

        instance.output.write('  ');

        base.deferred.resolve();
        return base.deferred.promise();
    };

    // --------------------------------------------------------------------------

    return base;
};
