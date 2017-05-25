/**
 * The main FakeTerminal class
 * @param el
 * @param options
 * @returns {window.FakeTerminal}
 */
window.FakeTerminal.main = function (el, options) {

    /**
     * Avoid scope issues by using `base` instead of `this`
     * @type {Object}
     */
    var base = this;
    if (!jQuery) {
        throw 'FakeTerminal: jQuery required';
    } else {
        var $ = jQuery;
    }

    /**
     * jQuery version of the element
     * @type {jQuery}
     */
    base.$el = $(el);

    /**
     * The original HTML of the element prior to initialisation (so we can restore the original terminal)
     * @type {string}
     */
    base.originalHtml = '';

    /**
     * Any existing items within the element
     * @type {Array}
     */
    base.existingText = [];

    /**
     * References to the currently executing command's instance and deferred object
     * @type {Object}
     */
    base.executingCommand = {
        'instance': null,
        'deferred': null
    };

    /**
     * Map of keyCodes
     * @type {Object}
     */
    base.keymap = {
        ENTER: 13,
        UP:    38,
        DOWN:  40,
        C:     67,
        D:     68,
        U:     85
    };

    /**
     * The output service
     * @type {window.FakeTerminal.output}
     */
    base.output = null;

    /**
     * The input service
     * @type {window.FakeTerminal.input}
     */
    base.input = null;

    /**
     * The filesystem service
     * @type {window.FakeTerminal.filesystem}
     */
    base.filesystem = null;

    /**
     * The history service
     * @type {window.FakeTerminal.history}
     */
    base.history = null;

    // --------------------------------------------------------------------------

    /**
     * Constructs the FakeTerminal
     * @return {void}
     */
    base.__construct = function () {

        base.$el.trigger('ft:init', [base]);

        //  Merge the options together
        base.options = $.extend({}, window.FakeTerminal.defaultOptions, options);

        //  Copy the original markup so we can destroy nicely
        base.originalHtml = base.$el.get(0).outerHTML;
        base.existingText = base.$el.get(0).innerHTML ? base.$el.get(0).innerHTML.split('\n') : [];

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

        /**
         * Add the existing content; if there is more than one line of content skip the first and last line
         * This is so that we can layout the HTML correctly, i.e contents on a new line
         */
        for (var i = 0, j = base.existingText.length; i < j; i++) {
            if (base.existingText.length > 1 && i === 0) {
                continue;/**/
            } else if (base.existingText.length > 1 && i === base.existingText.length - 1) {
                continue;
            }
            base.output.write($.trim(base.existingText[i]));
        }

        //  Focus the input
        base.input.focus();

        base.$el.trigger('ft:ready', [base]);

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
                    base.input.ctrlC();
                } else if (e.ctrlKey && e.which === base.keymap.U) {
                    base.input.ctrlU();
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

    /**
     * Replaces references to <info> etc with spans which can be colourised
     * @param {String} line The line to colorize
     * @returns {String}
     */
    base.colorize = function (line) {
        line = line.replace(/<([a-zA-Z].+?)>/g, '<span class="color--$1">', line);
        line = line.replace(/<\/([a-zA-Z].+)>/g, '</span>', line);
        return line;
    };

    // --------------------------------------------------------------------------

    /**
     * Scroll to the bottom of the terminal window
     * @returns {Object} A reference to the class, for chaining
     */
    base.scrollToBottom = function () {
        base.$el.scrollTop(base.$el.get(0).scrollHeight);
        return base;
    };

    // --------------------------------------------------------------------------

    /**
     * Destroys the fake terminal, reverting it back to its previous state
     * @return {Object} A reference to the class, for chaining
     */
    base.destroy = function () {
        base.$el.replaceWith($(base.originalHtml));
        base.$el.trigger('ft:destroy', [base]);
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
