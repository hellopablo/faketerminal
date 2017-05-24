/**
 * The main FakeTerminal class
 * @param el
 * @param options
 * @returns {window.FakeTerminal}
 */
window.FakeTerminal.main = function (el, options) {

    /**
     * To avoid scope issues, use 'base' instead of 'this' to reference
     * this class from internal events and functions.
     */

    var base = this;
    if (!jQuery) {
        throw 'FakeTerminal: jQuery required';
    } else {
        var $ = jQuery;
    }

    // Access to jQuery and DOM versions of element
    base.$el = $(el);
    base.el  = el;

    // --------------------------------------------------------------------------

    //  Field variables
    base.originalHtml     = '';
    base.existingText     = [];
    base.executingCommand = {
        'instance': null,
        'deferred': null
    };

    //  Easier to reference keyCodes
    base.keymap = {
        ENTER: 13,
        UP: 38,
        DOWN: 40,
        C: 67,
        D: 68,
        U: 85
    };

    //  Core classes
    base.output     = null;
    base.input      = null;
    base.filesystem = null;
    base.history    = null;

    // --------------------------------------------------------------------------

    /**
     * Constructs the FakeTerminal
     * @return {void}
     */
    base.__construct = function () {

        //  Merge the options together
        base.options = $.extend({}, window.FakeTerminal.defaultOptions, options);

        //  Copy the original markup so we can destroy nicely
        base.originalHtml = base.el.outerHTML;
        base.existingText = base.el.innerHTML ? base.el.innerHTML.split('\n') : [];

        //  Prepare the element
        base.$el
            .addClass('faketerminal')
            .empty();

        //  Bind listeners
        base.bindListeners();

        //  Construct the core classes
        base.output     = new window.FakeTerminal.output(base);
        base.input      = new window.FakeTerminal.input(base);
        base.filesystem = new window.FakeTerminal.filesystem(base);
        base.history    = new window.FakeTerminal.history(base);

        //  Add the existing content
        for (var i = 0, j = base.existingText.length; i < j; i++) {
            base.output.write($.trim(base.existingText[i]));
        }

        //  Focus the input
        base.input.focus();

        //  Run the login command, if there is one
        if (base.options.login) {
            base.exec(base.options.login);
        }
    };

    // --------------------------------------------------------------------------

    /**
     * Binds listeners to the DOM element
     * @return {void}
     */
    base.bindListeners = function () {
        base.$el
            .on('click', function () {
                base.input.focus();
            })
            .on('keyup', function (e) {
                if (e.ctrlKey && e.which === base.keymap.C) {
                    base.input.ctrl(base.keymap.C);
                } else if (e.ctrlKey && e.which === base.keymap.U) {
                    base.input.ctrl(base.keymap.U);
                }
            });
    };

    // --------------------------------------------------------------------------

    /**
     * Returns a new instance of a command if it exists
     * @return {Object}
     */
    base.findCommand = function (command) {
        var cmdInstance;
        if (typeof window.FakeTerminal.command[command] === 'function') {
            cmdInstance = new window.FakeTerminal.command[command](base);
        }
        return cmdInstance;
    };

    // --------------------------------------------------------------------------

    /**
     * Sets the value of the prompt automatically
     * @return {String}
     */
    base.getPrompt = function () {

        var hostname, username, cwd, text;

        //  Determine values
        if (typeof base.options.hostname === 'function') {
            hostname = base.options.hostname.call();
        } else {
            hostname = base.options.hostname;
        }

        if (typeof base.options.username === 'function') {
            username = base.options.username.call();
        } else {
            username = base.options.username;
        }

        if (typeof base.options.cwd === 'function') {
            cwd = base.options.cwd.call();
        } else {
            cwd = base.options.cwd;
        }

        //  Ensure the username is lowercase, alpha-numeric
        username = username.toLowerCase().replace(/[^a-z0-9]/g, '');

        //  Compile the string
        text = base.options.prompt;
        text = text.replace(/%hostname%/g, hostname);
        text = text.replace(/%username%/g, username);
        text = text.replace(/%cwd%/g, cwd);

        return base.colorize(text);
    };

    // --------------------------------------------------------------------------

    base.colorize = function(line) {
        line = line.replace(/<([a-zA-Z].+?)>/g, '<span class="color--$1">', line);
        line = line.replace(/<\/([a-zA-Z].+)>/g, '</span>', line);
        return line;
    };

    // --------------------------------------------------------------------------

    base.scrollToBottom = function () {
        base.$el.scrollTop(base.$el.get(0).scrollHeight);
    };

    // --------------------------------------------------------------------------

    /**
     * Destroys the fake terminal, reverting it back to its previous state
     * @return {Object} A reference to the class, for chaining
     */
    base.destroy = function () {
        base.$el.replaceWith($(base.originalHtml));
        return base;
    };

    // --------------------------------------------------------------------------

    /**
     * Executes a command
     * @param  {String}  commandString The command to execute
     * @param  {Boolean} hidden        Whether the commands are added to the command history
     * @return {Object}                A reference to the class, for chaining
     */
    base.exec = function (commandString, hidden) {

        var deferred, command, userArgs, commandInstance;
        deferred = new $.Deferred();

        commandString = $.trim(commandString);

        if (!hidden) {
            base.output.write(commandString, true);
        }

        //  If the command is empty then no need to proceed.
        if (commandString.length === 0) {
            deferred.reject();
            return deferred.promise();
        }

        command         = $.trim(commandString.split(' ').slice(0, 1));
        userArgs        = commandString.split(' ').slice(1);
        commandInstance = base.findCommand(command);

        if (commandInstance) {

            //  If a command is currently executing, terminate it
            if (base.executingCommand.instance) {
                base.executingCommand.instance.terminate();
                base.executingCommand.instance = null;
                base.executingCommand.deferred = null;
            }

            /**
             * The command has been called, hide the prompt until the command resolves
             * or if CTRL+C is encountered.
             */
            base.input.disable();

            /**
             * Call the command's execute function. It is responsible for output and
             * resolving the promise once it's complete
             */
            base.executingCommand.instance = commandInstance;
            base.executingCommand.deferred = commandInstance
                .execute.apply(commandInstance, userArgs)
                .done(function () {
                    deferred.resolve(arguments);
                })
                .fail(function () {
                    deferred.reject(arguments);
                })
                .always(function () {
                    base.input.enable().focus();
                });

        } else if (command.length > 0) {
            if (!hidden) {
                base.output.write('command not found: "' + command + '"');
            }
            deferred.reject();
        } else {
            deferred.reject();
        }

        if (!hidden) {
            base.history.push(command);
        }

        base.$el.trigger('ft:command', [base, command]);

        return deferred.promise();
    };

    // --------------------------------------------------------------------------

    // Run constructor
    base.__construct();
};
