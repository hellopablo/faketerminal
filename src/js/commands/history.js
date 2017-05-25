/**
 * The "history" command
 * @param  {window.FakeTerminal} instance The instance of FakeTerminal
 * @return {Object}
 */
window.FakeTerminal.command.history = function (instance) {

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
            description: 'Displays the command history, up to ' + instance.options.historyLength + ' items'
        };
    };

    // --------------------------------------------------------------------------

    /**
     * Executes the command
     * @return {Object} A promise which will be resolved when the command completes
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
