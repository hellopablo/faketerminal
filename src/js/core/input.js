/**
 * The input service
 * @return {Object}
 */
window.FakeTerminal.input = function (instance) {

    /**
     * Avoid scope issues by using `base` instead of `this`
     * @type {Object}
     */
    var base = this;

    // --------------------------------------------------------------------------

    /**
     * The input box the user can type into
     * @type {Object}
     */
    base.$input = null;

    /**
     * The input box the user can type into when requesting input
     * @type {Object}
     */
    base.$request = null;

    /**
     * The command line container
     * @type {Object}
     */
    base.$commandLine = null;

    /**
     * The input request container
     * @type {Object}
     */
    base.$inputRequest = null;

    // --------------------------------------------------------------------------

    /**
     * Constructs window.FakeTerminal.input
     * @returns {Object}
     * @private
     */
    base.__construct = function () {

        base.$prompt = $('<div>')
            .addClass('faketerminal__prompt')
            .attr('autocorrect', 'off')
            .attr('autocapitalize', 'none')
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

        // --------------------------------------------------------------------------

        base.$request      = $('<input>');
        base.$inputRequest = $('<div>')
            .addClass('faketerminal__commandline faketerminal__commandline--request');

        // --------------------------------------------------------------------------

        instance.$el
            .append(
                base.$commandLine
                    .append(base.$prompt)
                    .append(base.$input)
            )
            .append(
                base.$inputRequest
                    .append(base.$request)
            );

        // --------------------------------------------------------------------------

        base.enable();
        base.disableRequest();

        return base;
    };

    // --------------------------------------------------------------------------

    /**
     * Reads the value of base.$input and clears immediately after
     * @returns {String}
     */
    base.read = function () {
        var value = base.$input.val();
        base.$input.val('');
        return value;
    };

    // --------------------------------------------------------------------------

    /**
     * Requests user input from the user
     * @param {String} type The type of request; boolean
     * @returns {$.Deferred}
     */
    base.request = function (type) {

        type = type || 'TEXT';
        type = type.toUpperCase();

        switch (type) {
            case 'TEXT':
                return base.requestText();
                break;
            case 'BOOL':
            case 'BOOLEAN':
                return base.requestBool();
                break;
            case 'PASSWORD':
                return base.requestPassword();
                break;
            default:
                throw 'Invalid request type';
                break;
        }
    };

    // --------------------------------------------------------------------------

    /**
     * Requests text input from the user
     * @param {Boolean} muteOutput Whether to print what the user typed to the output or not
     * @returns {$.Deferred}
     */
    base.requestText = function (muteOutput) {

        var deferred = new $.Deferred();

        base.enableRequest();
        base.$request
            .on('keyup', function (e) {
                if (e.which === instance.keymap.ENTER) {
                    var value = $.trim(base.$request.val());
                    if (!muteOutput) {
                        instance.output.write(value);
                    }
                    deferred.resolve(value);
                    instance.$el.trigger('ft:command', [instance, value]);
                }
            });

        deferred.always(function () {
            base.disableRequest();
            base.$request.off('keyup');
        });

        return deferred.promise();
    };

    // --------------------------------------------------------------------------

    /**
     * Requests a boolean input from the user
     * @returns {$.Deferred}
     */
    base.requestBool = function () {

        var deferred = new $.Deferred();

        base.requestText()
            .done(function(value) {

                value = $.trim(String(value).toLowerCase());

                if (['1', 'true', 'yes', 'y', 'ok'].indexOf(value) !== -1) {
                    deferred.resolve();
                } else {
                    deferred.reject();
                }
            });

        return deferred.promise();
    };

    // --------------------------------------------------------------------------

    /**
     * Requests text input from the user, but hides it from screen and does not print to the output
     * @returns {$.Deferred}
     */
    base.requestPassword = function () {

        var deferred = new $.Deferred();

        base.$request.addClass('is-password');
        instance.output.write('Password:');
        base.requestText(true)
            .done(function(value) {
                base.$request.removeClass('is-password');
                deferred.resolve(value);
            });

        return deferred.promise();
    };

    // --------------------------------------------------------------------------

    /**
     * Sets the value of base.$input
     * @param {String} command The command to set
     */
    base.set = function (command) {
        base.$input.val(command);
    };

    // --------------------------------------------------------------------------

    /**
     * Focuses base.$input
     * @returns {Object}
     */
    base.focus = function () {
        if (base.$input.is(':visible')) {
            base.$input.focus();
        } else if (base.$request.is(':visible')) {
            base.$request.focus();
        }
        return base;
    };

    // --------------------------------------------------------------------------

    /**
     * Shows base.$commandLine
     * @returns {Object}
     */
    base.enable = function () {
        base.$commandLine.show();
        base.focus();
        instance.scrollToBottom();
        return base;
    };

    // --------------------------------------------------------------------------

    /**
     * Hides base.$commandLine
     * @returns {Object}
     */
    base.disable = function () {
        base.$commandLine.hide();
        base.$input.val('');
        return base;
    };

    // --------------------------------------------------------------------------

    /**
     * Shows base.$inputRequest
     * @returns {Object}
     */
    base.enableRequest = function () {
        base.$inputRequest.show();
        base.focus();
        return base;
    };

    // --------------------------------------------------------------------------

    /**
     * Hides base.$inputRequest
     * @returns {Object}
     */
    base.disableRequest = function () {
        base.$inputRequest.hide();
        base.$request.val('');
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
        base.disableRequest();
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
