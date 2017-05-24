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
    base.existing         = '';
    base.commands         = [];
    base.history          = [];
    base.historyIndex     = null;
    base.executingCommand = null;

    //  References to common elements
    base.theScreen       = null;
    base.theCommand      = null;
    base.thePrompt       = null;
    base.theInput        = null;
    base.theRequestInput = null;

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

        //  Setup the terminal
        base.setup();

        //  Look for (and instantiate) commands
        base.registerCommands();

        //  Focus the input
        base.focusCommandInput();

        //  Run the login command, if there is one
        if (base.options.loginCommand) {
            base.exec(base.options.loginCommand);
        }
    };

    // --------------------------------------------------------------------------

    /**
     * Sets up the fake terminal
     * @return {void}
     */
    base.setup = function () {

        //  Set all the appropriate classes
        base.$el.addClass('faketerminal');
        base.$el.addClass('faketerminal-theme-' + base.options.theme);

        /**
         * Take a note of any existing text, we'll populate the terminal with
         * it once we're done setting up.
         */

        base.existing = base.$el.html().split('\n');

        //  Create the terminal body
        var ul, li, prompt, input, requestInput;

        //  Contains all the terminal "lines"
        ul = $('<ul>');

        //  Contains the main prompt
        li = $('<li>')
            .addClass('ft-command');

        //  The text shown before the input
        prompt = $('<span>')
            .addClass('ft-prompt');

        //  The actual input, i.e., where the user types commands
        input = $('<span>')
            .addClass('ft-input')
            .prop('contenteditable', true);

        //  The request Input
        requestInput = $('<span>')
            .addClass('ft-request-input')
            .prop('contenteditable', true);

        //  Glue altogether and add to the DOM
        base.$el
            .empty()
            .append(
                ul.append(
                    li
                        .append(prompt)
                        .append(input)
                        .append(requestInput)
                )
            );

        //  Save references to common elements
        base.theScreen       = base.$el.find('>ul');
        base.theCommand      = base.theScreen.find('li.ft-command');
        base.thePrompt       = base.theCommand.find('.ft-prompt');
        base.theInput        = base.theCommand.find('.ft-input');
        base.theRequestInput = base.theCommand.find('.ft-request-input');

        //  Set the prompt's value
        base.setPrompt();

        //  Bind listeners
        base.theInput
            .on('keydown', function (e) {
                switch (e.which) {
                    case window.FakeTerminal.keymap.ENTER:
                        base.$el.trigger('ft:command', [base, base.getCommandInput()]);
                        base.enterCommandInput();
                        break;

                    case window.FakeTerminal.keymap.UP:
                        base.browseHistory('UP');
                        break;

                    case window.FakeTerminal.keymap.DOWN:
                        base.browseHistory('DOWN');
                        break;
                }
            });

        //  This just catches the enter keyUp and ensures that the value is cleared
        base.theInput
            .on('keyup', function (e) {
                switch (e.which) {
                    case window.FakeTerminal.keymap.ENTER:
                        base.setCommandInput('');
                        break;
                }
            });

        base.theRequestInput
            .on('keyup', function (e) {
                switch (e.which) {
                    case window.FakeTerminal.keymap.ENTER:
                        base.setRequestInput('');
                        break;
                }
            });

        base.$el
            .on('click', function () {
                if (base.theInput.is(':visible')) {
                    base.focusCommandInput();
                } else if (base.theRequestInput.is(':visible')) {
                    base.focusRequestInput();
                }

            })
            .on('keyup', function(e) {
                if (e.ctrlKey && e.which === window.FakeTerminal.keymap.C) {
                    base.ctrl(window.FakeTerminal.keymap.C);
                } else if (e.ctrlKey && e.which === window.FakeTerminal.keymap.U) {
                    base.ctrl(window.FakeTerminal.keymap.U);
                }
            });

        //  Add the existing content
        $.each(base.existing, function (index, value) {
            base.addLine(value);
        });
    };

    // --------------------------------------------------------------------------

    /**
     * Looks for available commands and register them
     * @return {void}
     */
    base.registerCommands = function () {

        if (typeof(window.FakeTerminal.command) === 'object') {
            $.each(window.FakeTerminal.command, function (index, element) {
                base.commands[index] = new element(base);
            });
        }
    };

    // --------------------------------------------------------------------------

    /**
     * Hides the entire prompt line
     * @return {Object} A reference to the class, for chaining
     */
    base.commandHide = function () {
        base.theCommand.hide();
    };

    // --------------------------------------------------------------------------

    /**
     * Hides the entire prompt line
     * @return {Object} A reference to the class, for chaining
     */
    base.commandShow = function () {
        base.theCommand.show();
    };

    // --------------------------------------------------------------------------

    /**
     * Sets the value of the prompt automatically
     * @param {string} hostname The hostname to use
     * @param {string} username The username to use
     * @param {string} cwd      The current working directory to use
     */
    base.setPrompt = function (hostname, username, cwd) {

        //  Determine values
        if (typeof(hostname) === 'undefined' || $.trim(hostname).length === 0) {
            if (typeof base.options.hostname === 'function') {
                hostname = base.options.hostname.call();
            } else {
                hostname = base.options.hostname;
            }
        }

        if (typeof(username) === 'undefined' || $.trim(username).length === 0) {
            if (typeof base.options.username === 'function') {
                username = base.options.username.call();
            } else {
                username = base.options.username;
            }
        }

        if (typeof(cwd) === 'undefined' || $.trim(cwd).length === 0) {
            if (typeof base.options.cwd === 'function') {
                cwd = base.options.cwd.call();
            } else {
                cwd = base.options.cwd;
            }
        }

        //  Ensure the username is lowercase, alpha-numeric
        username = username.toLowerCase().replace(/[^a-z0-9]/g, '');

        //  Compile the string
        var text = base.options.prompt;
        text = text.replace(/%hostname%/g, hostname);
        text = text.replace(/%username%/g, username);
        text = text.replace(/%cwd%/g, cwd);

        //  Set the text
        base.setPromptStr(text);
    };

    // --------------------------------------------------------------------------

    /**
     * Sets the prompt as a string
     * @param {string} str the string to set
     */
    base.setPromptStr = function (str) {

        //  Set the text
        base.thePrompt.html(str);

        //  Resize the editable area to take up the remaining space
        base.theInput.css('padding-left', base.thePrompt.outerWidth());
        base.theRequestInput.css('padding-left', base.thePrompt.outerWidth());
    };

    // --------------------------------------------------------------------------

    /**
     * Gets the current value of the prompt
     * @return {string}
     */
    base.getPrompt = function () {
        return base.thePrompt.text();
    };

    // --------------------------------------------------------------------------

    /**
     * Adds a new line to the FakeTerminal
     * @param {string} line The line to write to the terminal
     * @return {Object}     A reference to the class, for chaining
     */
    base.addLine = function (line) {

        /**
         * Prepare the line, we want spaces outside of <tags> to be encoded, (so
         * whitespace is maintained) but we also want to allow tags to work (so
         * commands can colourise things etc)
         */

        line = $.parseHTML(line);
        var output  = '';
        var encoded = '';

        $(line).each(function (index, value) {

            //  Encode text nodes
            if ($(value).get(0).nodeType === 3) {

                //  Set the entire string as the output
                encoded = $(value).get(0).nodeValue.replace(/ /g, '&nbsp;');

            } else {

                //  Encode the containing text
                $(value).html($(value).text().replace(/ /g, '&nbsp;'));

                //  Set the element + encoded text as the line
                encoded = $(value).prop('outerHTML');
            }

            output += encoded;
        });

        //  Add the line
        var li = $('<li>').html(output);
        base.theCommand.before(li);

        //  Scroll the terminal window
        base.scrollTerminalToBottom();

        //  Return class for chaining
        return base;
    };

    // --------------------------------------------------------------------------

    base.scrollTerminalToBottom = function () {
        var totalHeight = 0;
        //  Calculate the height of all the <li>'s
        $.each(base.theScreen.find('>li'), function (index) {
            totalHeight += $(this).outerHeight();
        });

        base.theScreen.scrollTop(totalHeight);
    };

    // --------------------------------------------------------------------------

    /**
     * Browse through the command history
     * @param  {string} direction Whether to go UP or DOWN through history
     * @return {Object}           A reference to the class, for chaining
     */
    base.browseHistory = function (direction) {

        if (direction === 'UP') {

            /**
             * Going up through the history. if historyIndex is null then set it
             * to the end of history array.
             */

            if (base.historyIndex === null) {

                base.historyIndex = base.history.length;
            }

            //  Go down an index
            base.historyIndex--;

            //  Don't go below 0
            if (base.historyIndex < 0) {

                base.historyIndex = 0;
            }

        } else if (direction === 'DOWN') {

            /**
             * Going down through the history. if historyIndex is null then set it
             * to the beginning of the history array
             */

            if (base.historyIndex === null) {

                base.historyIndex = 0;
            }

            //  Go up an index
            base.historyIndex++;

            //  Don't go beyond the limits!
            if (base.historyIndex >= base.history.length) {

                base.historyIndex = base.history.length;
            }
        }

        // --------------------------------------------------------------------------

        //  Get the command
        var command = base.history[base.historyIndex] || '';

        //  Set it
        base.setCommandInput(command);

        //  Move the cursor to the end of the string
        //  @todo

        return base;
    };

    // --------------------------------------------------------------------------

    /**
     * Handles when a command is entered
     * @return {Object} A reference to the class, for chaining
     */
    base.enterCommandInput = function (noHistory) {

        var value, command, userArgs;

        //  Get the current command
        value = base.getCommandInput();

        // --------------------------------------------------------------------------

        //  Clear the input
        base.theInput.empty();

        // --------------------------------------------------------------------------

        //  Add the called command as a line
        base.addLine(base.getPrompt() + value);

        // --------------------------------------------------------------------------

        command  = value.split(' ').slice(0, 1);
        command  = $.trim(command);
        userArgs = value.split(' ').slice(1);

        if (typeof(base.commands[command]) === 'object') {

            //  If a command is currently executing, terminate it
            if (base.executingCommand) {
                base.executingCommand.reject();
                base.executingCommand = null;
            }

            /**
             * The command has been called, hide the prompt until the command resolves
             * or if CTRL+C is encountered.
             */

            //  Hide prompt
            base.commandHide();

            /**
             * Call the execute function. It is responsible for writing to the
             * terminal screen and resolving the promise once it's done
             */

            base.executingCommand = base.commands[command]
                .execute(userArgs, base)
                .always(function () {
                    //  Show and focus the prompt and scroll to the bottom
                    base.commandShow();
                    base.focusCommandInput();
                    base.scrollTerminalToBottom();
                });

        } else if (command.length > 0) {
            base.addLine('command not found: "' + command + '"');
        }

        // --------------------------------------------------------------------------

        //  Add to the history, and reset the history index
        if (!noHistory && value.length > 0) {
            base.history.push(value);
        }
        base.historyIndex = null;

        // --------------------------------------------------------------------------

        //  Fire the ft:command event
        base.$el.trigger('ft:command', [base, value]);

        // --------------------------------------------------------------------------

        return base;
    };

    // --------------------------------------------------------------------------

    /**
     * Sets a command in the prompt
     * @param {string} command The command to set
     * @return {Object}        A reference to the class, for chaining
     */
    base.setCommandInput = function (command) {
        base.theInput.text(command);
        return base;
    };

    // --------------------------------------------------------------------------

    /**
     * Gets the current command in the prompt
     * @return {string}
     */
    base.getCommandInput = function () {
        return $.trim(base.theInput.text());
    };

    // --------------------------------------------------------------------------

    /**
     * Set focus on the command input
     * @return {Object} A reference to the class, for chaining
     */
    base.focusCommandInput = function () {
        base.theCommand.removeClass('ft-request-input');
        base.theInput.empty().focus();
        return base;
    };

    // --------------------------------------------------------------------------

    /**
     * Request some input from the user
     * @param question The question to put to the user
     * @param {string} defaultVal
     * @param {function} callbackMethod
     * @param {object} callbackInstance
     */
    base.requestInput = function (question, defaultVal, callbackMethod, callbackInstance) {

        var message, returnVal;

        //  Show and reset the requestInput
        base.commandShow();
        base.theCommand.addClass('ft-request-input');

        /**
         * Set the question as the value of the prompt. This replaces the prompt,
         * we change it back after
         */

        message = '<span class="ft-info">?</span> ' + question + ': ';
        message += '<span class="ft-mute">(' + defaultVal + ')</span>';
        base.setPromptStr(message);

        //   Bind listeners
        base.focusRequestInput();

        base.theRequestInput
            .off('keydown');

        base.theRequestInput
            .on('keydown', function (e) {

                returnVal = true;

                switch (e.which) {

                    case window.FakeTerminal.keymap.ENTER:

                        //  Fire the ft:command event
                        base.$el.trigger('ft:command', [base, base.getRequestInput()]);

                        //  Reset the input
                        base.focusCommandInput();
                        base.setPrompt();

                        //  Hide the requestInput
                        base.commandHide();

                        //  Get the user's response
                        value = $.trim(base.theRequestInput.text());

                        //  Set the default Val if the user didn't say anything
                        if (value.length === 0) {
                            value = defaultVal;
                        }

                        //  Execute the callback
                        callbackInstance[callbackMethod](value);

                        //  False returnVal
                        returnVal = false;

                        break;

                    case window.FakeTerminal.keymap.C:
                        if (e.ctrlKey) {
                            base.ctrlC();
                        }
                        break;
                }

                return returnVal;
            });
    };

    // --------------------------------------------------------------------------

    /**
     * Sets a command in the requestInput prompt
     * @param {string} input The input to set
     * @return {Object}        A reference to the class, for chaining
     */
    base.setRequestInput = function (input) {
        base.theRequestInput.text(input);
        return base;
    };

    // --------------------------------------------------------------------------

    /**
     * Gets the current requestInput in the prompt
     * @return {string}
     */
    base.getRequestInput = function () {
        return $.trim(base.theRequestInput.text());
    };

    // --------------------------------------------------------------------------

    base.focusRequestInput = function () {
        base.theCommand.addClass('ft-request-input');
        base.theRequestInput.empty().focus();
        return base;
    };

    // --------------------------------------------------------------------------

    base.ctrl = function (letter) {
        switch (letter) {
            case window.FakeTerminal.keymap.C:
                base.ctrlC();
                break;

            case window.FakeTerminal.keymap.U:
                base.ctrlU();
                break;
        }
    };

    // --------------------------------------------------------------------------

    /**
     * Exits out of any running task
     * @return {void}
     */
    base.ctrlC = function () {
        /**
         * Reset the prompt in case we're in the middle of requesting input form
         * the user
         */

        base.setPrompt();

        /**
         * If a command is executing reject it and show some feedback; if not
         * just repeat the prompt
         */

        if (base.executingCommand) {
            base.executingCommand.reject();
            base.executingCommand = null;
            base.addLine('^C');
        } else {
            base.addLine(base.getPrompt() + base.getCommandInput());
        }

        //  Focus the command prompt
        base.focusCommandInput();
    };

    // --------------------------------------------------------------------------

    /**
     * Resets the command input
     * @return {void}
     */
    base.ctrlU = function () {
        base.setCommandInput('');
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
     * Executes a command, or an array of commands
     * @param  {String|Array} command The command, or commands, to execute
     * @param  {Boolean}      hidden  Whether the commands are added to the command history
     * @return {Object}               A reference to the class, for chaining
     */
    base.exec = function (command, hidden) {
        if ($.isArray(command)) {
            for (var i = 0, j = command.length; i < j; i++) {
                base.exec(command[i], hidden);
            }
        } else {
            base.setCommandInput(command);
            base.enterCommandInput(hidden);
        }
        return base;
    };

    // --------------------------------------------------------------------------

    base.log = function () {
        if (typeof console === 'function') {
            console.log.apply(base, arguments);
        }
    };

    // --------------------------------------------------------------------------

    base.warn = function () {
        if (typeof console === 'function') {
            console.warn.apply(base, arguments);
        }
    };

    // --------------------------------------------------------------------------

    base.error = function () {
        if (typeof console === 'function') {
            console.error.apply(base, arguments);
        }
    };

    // --------------------------------------------------------------------------

    // Run constructor
    base.__construct();
};
