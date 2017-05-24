window.FakeTerminal.input = function (instance) {

    var base = this;

    // --------------------------------------------------------------------------

    base.$input       = null;
    base.$commandLine = null;

    // --------------------------------------------------------------------------

    base.__construct = function () {

        base.$prompt = $('<div>')
            .addClass('faketerminal__prompt')
            .html(instance.getPrompt());

        base.$input = $('<input>')
            .on('keyup', function (e) {
                switch (e.which) {
                    case instance.keymap.ENTER:
                        instance.exec(base.read())
                            .done(function () {
                                //  Update the prompt, it may have been altered
                                base.$prompt.html(instance.getPrompt());
                            });
                        break;

                    case instance.keymap.UP:
                    case instance.keymap.DOWN:
                        base.set(instance.history.browse(e.which));
                        break;
                }
            });

        base.$commandLine = $('<div>')
            .addClass('faketerminal__commandline');

        instance.$el.append(
            base.$commandLine
                .append(base.$prompt)
                .append(base.$input)
        );

        return base;
    };

    // --------------------------------------------------------------------------

    base.read = function () {
        var value = base.$input.val();
        base.$input.val('');
        return value;
    };

    // --------------------------------------------------------------------------

    base.set = function (command) {
        base.$input.val(command);
    };

    // --------------------------------------------------------------------------

    base.focus = function () {
        base.$input.focus();
    };

    // --------------------------------------------------------------------------

    base.enable = function () {
        base.$commandLine.show();
        return base;
    };

    // --------------------------------------------------------------------------

    base.disable = function () {
        base.$commandLine.hide();
        return base;
    };

    // --------------------------------------------------------------------------

    base.ctrl = function (letter) {
        switch (letter) {
            case instance.keymap.C:
                base.ctrlC();
                break;

            case instance.keymap.U:
                base.ctrlU();
                break;
        }
        return base;
    };

    // --------------------------------------------------------------------------

    /**
     * Exits out of any running task
     * @return {Object}
     */
    base.ctrlC = function () {

        /**
         * If a command is executing reject it and show some feedback; if not
         * just repeat the prompt
         */

        if (instance.executingCommand.instance) {
            instance.executingCommand.instance.terminate();
            instance.executingCommand.instance = null;
            instance.executingCommand.deferred = null;
            instance.output.write('^C', true);
        } else {
            var value = base.read();
            if (value.length) {
                instance.output.write(value, true);
                instance.output.write('^C', true);
            }
            instance.output.write('', true);
        }

        //  Focus the command prompt
        base.focus();

        return base;
    };

    // --------------------------------------------------------------------------

    /**
     * Resets the command input
     * @return {Object}
     */
    base.ctrlU = function () {
        base.$input.val('');
        return base;
    };

    // --------------------------------------------------------------------------

    return base.__construct();
};
