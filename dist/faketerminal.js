(function($) {
    //  Create namespace if not already created
    if (!$.fakeTerminal) {
        $.fakeTerminal = {};
    }
    //  Create command namespace if not already created
    if (!$.fakeTerminal.command) {
        $.fakeTerminal.command = {};
    }
    // --------------------------------------------------------------------------
    $.fakeTerminal.fakeTerminal = function(el, options) {
        /**
         * To avoid scope issues, use 'base' instead of 'this' to reference
         * this class from internal events and functions.
         */
        var base = this;
        // Access to jQuery and DOM versions of element
        base.$el = $(el);
        base.el = el;
        // Add a reverse reference to the DOM object
        base.$el.data("fakeTerminal.fakeTerminal", base);
        // --------------------------------------------------------------------------
        //  Field variables
        base.originalHtml = "";
        base.existing = "";
        base.commands = [];
        base.history = [];
        base.historyIndex = null;
        base.exitCode = -1;
        // -1 means "not doing anything", null means waiting, positive Int is an exitCode
        base.watchExitCode = null;
        //  References to common elements
        base.theHeader = null;
        base.theScreen = null;
        base.theCommand = null;
        base.thePrompt = null;
        base.theInput = null;
        base.theRequestInput = null;
        // --------------------------------------------------------------------------
        /**
         * Constructs the faketerminal
         * @return {void}
         */
        base.__construct = function() {
            //  Merge the options together
            base.options = $.extend({}, $.fakeTerminal.fakeTerminal.defaultOptions, options);
            //  Copy the original markup so we can destroy nicely
            base.originalHtml = base.el.outerHTML;
            //  Setup the terminal
            base.setup();
            //  Look for, and instanciate, commands
            base.registerCommands();
            //  focus the input
            base.focusCommandInput();
            //  Run any initCommands
            for (var i = 0; i < base.options.initCommands.length; i++) {
                base.setCommandInput(base.options.initCommands[i]);
                base.enterCommandInput();
            }
            //  Bind to the header buttons
            base.theHeader.find(".ft-header-button-close").on("click", function() {
                base.options.onClose(base);
            });
            base.theHeader.find(".ft-header-button-minimise").on("click", function() {
                base.options.onMinimise(base);
            });
            base.theHeader.find(".ft-header-button-maximise").on("click", function() {
                base.options.onMaximise(base);
            });
        };
        // --------------------------------------------------------------------------
        /**
         * Sets up the fake terminal
         * @return {void}
         */
        base.setup = function() {
            //  Set all the appropriate classes
            base.$el.addClass("faketerminal");
            base.$el.addClass("faketerminal-theme-" + base.options.theme);
            /**
             * Take a note of any existing text, we'll populate the terminal with
             * it once we're done setting up.
             */
            base.existing = base.$el.html().split("\n");
            //  Create the terminal body
            var header, headerButtons, headerButton, ul, li, prompt, input, requestInput;
            //  Is the terminal header
            header = $("<div>").addClass("ft-header");
            headerButtons = $("<ul>").addClass("ft-header-buttons");
            headerButton = [];
            headerButton[0] = $("<li>").addClass("ft-header-button ft-header-button-close").text("×");
            headerButton[1] = $("<li>").addClass("ft-header-button ft-header-button-minimise").text("-");
            headerButton[2] = $("<li>").addClass("ft-header-button ft-header-button-maximise").text("+");
            //  Contains all the terminal "lines"
            ul = $("<ul>");
            //  Contains the main prompt
            li = $("<li>").addClass("ft-command");
            //  The text shown before the input
            prompt = $("<span>").addClass("ft-prompt");
            //  The actual input, i.e., where the user types commands
            input = $("<span>").addClass("ft-input").prop("contenteditable", true);
            //  The request Input
            requestInput = $("<span>").addClass("ft-request-input").prop("contenteditable", true);
            //  Glue altogether and add to the DOM
            base.$el.empty().append(header.append(headerButtons.append(headerButton[0]).append(headerButton[1]).append(headerButton[2]))).append(ul.append(li.append(prompt).append(input).append(requestInput)));
            //  Save references to commen elements
            base.theHeader = base.$el.find(">.ft-header");
            base.theScreen = base.$el.find(">ul");
            base.theCommand = base.theScreen.find("li.ft-command");
            base.thePrompt = base.theCommand.find(".ft-prompt");
            base.theInput = base.theCommand.find(".ft-input");
            base.theRequestInput = base.theCommand.find(".ft-request-input");
            //  Set the prompt's value
            base.setPrompt();
            //  Bind listeners
            base.theInput.on("keydown", function(e) {
                switch (e.keyCode) {
                  //  Enter
                    case 13:
                    //  Fire the onUserEnterCommand event
                    base.options.onUserEnterCommand(base, base.getCommandInput());
                    //  Handle command
                    base.enterCommandInput();
                    break;

                  //  Up arrow
                    case 38:
                    base.browseHistory("UP");
                    break;

                  //  Down arrow
                    case 40:
                    base.browseHistory("DOWN");
                    break;

                  //  "C" key
                    case 67:
                    if (e.ctrlKey) {
                        base.ctrl("C");
                    }
                    break;

                  //  "U" key
                    case 85:
                    if (e.ctrlKey) {
                        base.ctrl("U");
                    }
                    break;
                }
            });
            //  This just catches the enter keyUp and ensures that the value is cleared
            base.theInput.on("keyup", function(e) {
                switch (e.keyCode) {
                  //  Enter
                    case 13:
                    base.setCommandInput("");
                    break;
                }
            });
            base.theRequestInput.on("keyup", function(e) {
                switch (e.keyCode) {
                  //  Enter
                    case 13:
                    base.setRequestInput("");
                    break;
                }
            });
            base.$el.on("click", function() {
                if (base.theInput.is(":visible")) {
                    base.focusCommandInput();
                } else if (base.theRequestInput.is(":visible")) {
                    base.focusRequestInput();
                }
            });
            //  Add the existing content
            $.each(base.existing, function(index, value) {
                base.addLine(value);
            });
        };
        // --------------------------------------------------------------------------
        /**
         * Looks for available commands and register them
         * @return {void}
         */
        base.registerCommands = function() {
            if (typeof $.fakeTerminal.command === "object") {
                $.each($.fakeTerminal.command, function(index, element) {
                    base.commands[index] = new element(base);
                });
            }
        };
        // --------------------------------------------------------------------------
        /**
         * Hides the entire prompt line
         * @return {Object} A reference to the class, for chaining
         */
        base.commandHide = function() {
            base.theCommand.hide();
        };
        // --------------------------------------------------------------------------
        /**
         * Hides the entire prompt line
         * @return {Object} A reference to the class, for chaining
         */
        base.commandShow = function() {
            base.theCommand.show();
        };
        // --------------------------------------------------------------------------
        /**
         * Sets the value of the prompt automatically
         * @param {string} host The host to use
         * @param {string} user The user to use
         */
        base.setPrompt = function(host, user, dir) {
            //  Determine values
            host = typeof host === "undefined" || $.trim(host).length === 0 ? base.options.hostname : host;
            user = typeof user === "undefined" || $.trim(user).length === 0 ? base.options.username : user;
            dir = typeof dir === "undefined" || $.trim(dir).length === 0 ? base.options.initDir : dir;
            //  Ensure the username is lowercase, alpha-numeric
            user = user.toLowerCase().replace(/[^a-z0-9]/g, "");
            //  Compile the string
            var text = host + ":" + dir + " " + user + "$ ";
            //  Set the text
            base.setPromptStr(text);
        };
        // --------------------------------------------------------------------------
        /**
         * Sets the prompt as a string
         * @param {string} str the string to set
         */
        base.setPromptStr = function(str) {
            //  Set the text
            base.thePrompt.html(str);
            //  Resize the editable area to take up the remaining space
            base.theInput.css("padding-left", base.thePrompt.outerWidth());
            base.theRequestInput.css("padding-left", base.thePrompt.outerWidth());
        };
        // --------------------------------------------------------------------------
        /**
         * Gets the current value of the prompt
         * @return {string}
         */
        base.getPrompt = function() {
            return base.thePrompt.text();
        };
        // --------------------------------------------------------------------------
        /**
         * Adds a new line to the faketerminal
         * @param {string} line The line to write to the terminal
         * @return {Object}     A reference to the class, for chaining
         */
        base.addLine = function(line) {
            /**
             * Prepare the line, we want spaces outside of <tags> to be encoded, (so
             * whitespace is maintained) but we also want to allow tags to work (so
             * commands can colourise things etc)
             */
            line = $.parseHTML(line);
            var output = "";
            var encoded = "";
            $(line).each(function(index, value) {
                //  Encode text nodes
                if ($(value).get(0).nodeType === 3) {
                    //  Set the entire string as the output
                    encoded = $(value).get(0).nodeValue.replace(/ /g, "&nbsp;");
                } else {
                    //  Encode the containing text
                    $(value).html($(value).text().replace(/ /g, "&nbsp;"));
                    //  Set the element + encoded text as the line
                    encoded = $(value).prop("outerHTML");
                }
                output += encoded;
            });
            //  Add the line
            var li = $("<li>").html(output);
            base.theCommand.before(li);
            //  Scroll the terminal window
            base.scrollTerminalToBottom();
            //  Return class for chaining
            return base;
        };
        // --------------------------------------------------------------------------
        base.scrollTerminalToBottom = function() {
            var totalHeight = 0;
            //  Calculate the height of all the <li>'s
            $.each(base.theScreen.find(">li"), function(index) {
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
        base.browseHistory = function(direction) {
            if (direction === "UP") {
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
            } else if (direction === "DOWN") {
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
            var command = base.history[base.historyIndex] || "";
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
        base.enterCommandInput = function() {
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
            command = value.split(" ").slice(0, 1);
            command = $.trim(command);
            userArgs = value.split(" ").slice(1);
            if (typeof base.commands[command] == "object") {
                /**
                 * The command has been called, hide the prompt until the command registers
                 * itself as having completed (by setting the exitCode to a non-null value)
                 * or if CTRL+C is encountered.
                 */
                //  Hide prompt
                base.commandHide();
                //  Reset exit code
                base.exitCode = null;
                base.watchExitCode = setInterval(function() {
                    if (base.exitCode !== null) {
                        //  Cancel the loop
                        clearInterval(base.watchExitCode);
                        //  Show and focus the prompt
                        base.commandShow();
                        base.focusCommandInput();
                        //  Scroll terminal to bottom
                        base.scrollTerminalToBottom();
                        //  Reset exitCode
                        base.exitCode = "";
                    }
                }, 50);
                /**
                 * Call the execute function. It is responsible for writing to the
                 * terminal screen and calling the exit() method when done.
                 */
                base.commands[command].execute(userArgs, base);
            } else if (command.length > 0) {
                base.addLine('command not found: "' + command + '"');
            }
            // --------------------------------------------------------------------------
            //  Add to the history, and reset the history index
            if (value.length > 0) {
                base.history.push(value);
            }
            base.historyIndex = null;
            // --------------------------------------------------------------------------
            //  Fire the onEnterCommand event
            base.options.onEnterCommand(base, value);
            // --------------------------------------------------------------------------
            return base;
        };
        // --------------------------------------------------------------------------
        /**
         * Sets a command in the prompt
         * @param {string} command The command to set
         * @return {Object}        A reference to the class, for chaining
         */
        base.setCommandInput = function(command) {
            base.theInput.text(command);
            return base;
        };
        // --------------------------------------------------------------------------
        /**
         * Gets the current command in the prompt
         * @return {string}
         */
        base.getCommandInput = function() {
            return $.trim(base.theInput.text());
        };
        // --------------------------------------------------------------------------
        /**
         * Set focus on the command input
         * @return {Object} A reference to the class, for chaining
         */
        base.focusCommandInput = function() {
            base.theCommand.removeClass("ft-request-input");
            base.theInput.empty().focus();
            return base;
        };
        // --------------------------------------------------------------------------
        /**
         * Request some input from the user
         * @param  {string} question The question to put to the user
         * @return {string}
         */
        base.requestInput = function(question, defaultVal, callbackMethod, callbackInstance) {
            var message, returnVal;
            //  Show and reset the requestInput
            base.commandShow();
            base.theCommand.addClass("ft-request-input");
            /**
             * Set the question as the value of the prompt. This replaces the prompt,
             * we change it back after
             */
            message = '<span class="ft-info">?</span> ' + question + ": ";
            message += '<span class="ft-mute">(' + defaultVal + ")</span>";
            base.setPromptStr(message);
            //   Bind listener
            base.focusRequestInput();
            base.theRequestInput.off("keydown");
            base.theRequestInput.on("keydown", function(e) {
                returnVal = true;
                switch (e.keyCode) {
                  //  Enter
                    case 13:
                    //  Fire the onUserEnterInput event
                    base.options.onUserEnterInput(base, base.getRequestInput());
                    //  Reset the input
                    base.focusCommandInput();
                    base.setPrompt();
                    //  Hide the requestInput
                    base.commandHide();
                    //  Get the user's response
                    value = $.trim(base.theRequestInput.text());
                    //  Set the default Val if the user didnt say anything
                    if (value.length === 0) {
                        value = defaultVal;
                    }
                    //  Execute the callback
                    callbackInstance[callbackMethod](value);
                    //  False returnVal
                    returnVal = false;
                    break;

                  //  "C" key
                    case 67:
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
        base.setRequestInput = function(input) {
            base.theRequestInput.text(input);
            return base;
        };
        // --------------------------------------------------------------------------
        /**
         * Gets the current requestInput in the prompt
         * @return {string}
         */
        base.getRequestInput = function() {
            return $.trim(base.theRequestInput.text());
        };
        // --------------------------------------------------------------------------
        base.focusRequestInput = function() {
            base.theCommand.addClass("ft-request-input");
            base.theRequestInput.empty().focus();
            return base;
        };
        // --------------------------------------------------------------------------
        base.ctrl = function(letter) {
            switch (letter) {
              case "C":
                base.ctrlC();
                break;

              case "U":
                base.ctrlU();
                break;
            }
        };
        // --------------------------------------------------------------------------
        /**
         * Exits out of any running task
         * @return {void}
         */
        base.ctrlC = function() {
            /**
             * Reset the prompt in case we're in the middle of requesting input form
             * the user
             */
            base.setPrompt();
            /**
             * If waiting to exit reset the exit code and show some feedback; if not
             * just repeat the prompt
             */
            if (base.exitCode === null) {
                base.exitCode = "";
                base.addLine("^C");
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
        base.ctrlU = function() {
            base.setCommandInput("");
        };
        // --------------------------------------------------------------------------
        /**
         * Destroys the fake terminal, reverting it back to its previous state
         * @return {Object} A reference to the class, for chaining
         */
        base.destroy = function() {
            base.$el.replaceWith($(base.originalHtml));
            return base;
        };
        // --------------------------------------------------------------------------
        // Run constructor
        base.__construct();
        return base;
    };
    // --------------------------------------------------------------------------
    /**
     * The default options
     * @type {Object}
     */
    $.fakeTerminal.fakeTerminal.defaultOptions = {
        theme: "default",
        username: "root",
        hostname: window.location.host,
        historyLength: 1e3,
        initCommands: [],
        initDir: "~",
        onEnterCommand: function(instance, command) {},
        onUserEnterCommand: function(instance, command) {},
        onUserEnterInput: function(instance, response) {},
        onClose: function(instance) {},
        onMinimise: function(instance) {},
        onMaximise: function(instance) {}
    };
    // --------------------------------------------------------------------------
    /**
     * The base command object, commands should extend this object
     * @return {Object}
     */
    $.fakeTerminal.command._base = function(instance) {
        /**
         * To avoid scope issues, use 'base' instead of 'this' to reference
         * this class from internal events and functions.
         */
        var base = this;
        /**
         * Describes the command
         * @return {Object}
         */
        base.info = function() {
            return {
                "private": true
            };
        };
        // --------------------------------------------------------------------------
        /**
         * This method is called when fake terminal encounters the command which this class represents
         * @param  {array} userArgs An array of arguments passed by the user
         * @return {array}          An array of lines to render to the screen
         */
        base.execute = function(userArgs) {
            return [];
        };
        // --------------------------------------------------------------------------
        /**
         * Exits execution of the command
         * @param  {Number} exitCode The exit code to give
         * @return {void}
         */
        base.exit = function(exitCode) {
            instance.exitCode = parseInt(exitCode, 10);
        };
    };
    // --------------------------------------------------------------------------
    /**
     * Register plugin with jQuery
     * @param  {Object} options Overrides default options
     * @return {Object}         The instance of this class.
     */
    $.fn.faketerminal = function(options) {
        return this.each(function() {
            new $.fakeTerminal.fakeTerminal(this, options);
        });
    };
})(jQuery);

(function($) {
    //  Create namespace if not already created
    if (!$.fakeTerminal) {
        $.fakeTerminal = {};
    }
    //  Create command namespace if not already created
    if (!$.fakeTerminal.command) {
        $.fakeTerminal.command = {};
    }
    // --------------------------------------------------------------------------
    /**
     * The "echo" command
     * @param  {Object} instance The instance of fakeTerminal
     * @return {Object}
     */
    $.fakeTerminal.command.clear = function(instance) {
        //  Extend the base command
        $.fakeTerminal.command._base.apply(this, arguments);
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
        base.info = function() {
            return {
                description: "Clears the screen"
            };
        };
        // --------------------------------------------------------------------------
        /**
         * This method is called when fake terminal encounters the command which this
         * class represents
         * @param  {array} userArgs An array of arguments passed by the user
         * @return {Object}
         */
        base.execute = function(userArgs) {
            instance.theScreen.find("li:not(.ft-command)").remove();
            //  Cleanly exit
            base.exit(0);
            return base;
        };
        // --------------------------------------------------------------------------
        return base;
    };
})(jQuery);

(function($) {
    //  Create namespace if not already created
    if (!$.fakeTerminal) {
        $.fakeTerminal = {};
    }
    //  Create command namespace if not already created
    if (!$.fakeTerminal.command) {
        $.fakeTerminal.command = {};
    }
    // --------------------------------------------------------------------------
    /**
     * The "echo" command
     * @param  {Object} instance The instance of fakeTerminal
     * @return {Object}
     */
    $.fakeTerminal.command.echo = function(instance) {
        //  Extend the base command
        $.fakeTerminal.command._base.apply(this, arguments);
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
        base.info = function() {
            return {
                description: "Writes an argument to the standard output"
            };
        };
        // --------------------------------------------------------------------------
        /**
         * This method is called when fake terminal encounters the command which this
         * class represents
         * @param  {array} userArgs An array of arguments passed by the user
         * @return {Object}
         */
        base.execute = function(userArgs) {
            var returnVal;
            //  Merge all the arguments
            returnVal = userArgs.join(" ");
            returnVal = $.trim(returnVal);
            //  Remove quotes
            returnVal = returnVal.replace(/["']/g, "");
            returnVal = returnVal.replace(/["']/g, "");
            //  Ensure we write *something* to the screen
            if (returnVal.length === 0) {
                returnVal = " ";
            }
            //  Wrote to the terminal
            instance.addLine(returnVal);
            //  Cleanly exit
            base.exit(0);
            return base;
        };
        // --------------------------------------------------------------------------
        return base;
    };
})(jQuery);

(function($) {
    //  Create namespace if not already created
    if (!$.fakeTerminal) {
        $.fakeTerminal = {};
    }
    //  Create command namespace if not already created
    if (!$.fakeTerminal.command) {
        $.fakeTerminal.command = {};
    }
    // --------------------------------------------------------------------------
    /**
     * The "help" command
     * @param  {Object} instance The instance of fakeTerminal
     * @return {Object}
     */
    $.fakeTerminal.command.help = function(instance) {
        //  Extend the base command
        $.fakeTerminal.command._base.apply(this, arguments);
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
        base.info = function() {
            return {
                description: "Displays information about the available commands"
            };
        };
        // --------------------------------------------------------------------------
        /**
         * This method is called when fake terminal encounters the command which this
         * class represents
         * @param  {array} userArgs An array of arguments passed by the user
         * @return {Object}
         */
        base.execute = function(userArgs) {
            var returnVal = [];
            var commandInfo = {};
            var temp;
            if (userArgs.length === 0) {
                returnVal.push('The following commands are available, run <span class="ft-info">help [command]</span> to find out more.');
                returnVal.push(" ");
                var commandString = "";
                $.each($.fakeTerminal.command, function(command, value) {
                    var temp = new $.fakeTerminal.command[command](instance);
                    //  Check to see if the command is private
                    if (typeof temp.info == "function") {
                        commandInfo = temp.info();
                        if (typeof commandInfo.private == "boolean" && commandInfo.private === true) {
                            return;
                        }
                    }
                    commandString += command + "    ";
                });
                returnVal.push(commandString);
                returnVal.push(" ");
            } else {
                var command = userArgs[0];
                var isValidCommand = false;
                $.each($.fakeTerminal.command, function(index, value) {
                    if (index === command) {
                        isValidCommand = true;
                    }
                });
                if (isValidCommand) {
                    temp = new $.fakeTerminal.command[command](instance);
                    if (typeof temp.info == "function") {
                        commandInfo = temp.info();
                        if (typeof commandInfo.description === "string") {
                            returnVal = [ " ", command + " -- " + commandInfo.description, " " ];
                        } else if (typeof commandInfo.description === "object") {
                            returnVal = commandInfo.description;
                        }
                    }
                    if (returnVal.length === 0) {
                        returnVal = [ " ", 'No description for "' + command + '"', " " ];
                    }
                } else {
                    returnVal = [ " ", '"' + command + '" is not a valid command', " " ];
                }
            }
            //  Write to the terminal
            for (var i = 0; i < returnVal.length; i++) {
                instance.addLine(returnVal[i]);
            }
            //  Cleanly exit
            base.exit(0);
            return base;
        };
        // --------------------------------------------------------------------------
        return base;
    };
    // --------------------------------------------------------------------------
    /**
     * The "man" command, an alias of "help"
     * @return {Object}
     */
    $.fakeTerminal.command.man = function() {
        $.fakeTerminal.command.help.apply(this, arguments);
        return this;
    };
})(jQuery);

(function($) {
    //  Create namespace if not already created
    if (!$.fakeTerminal) {
        $.fakeTerminal = {};
    }
    //  Create command namespace if not already created
    if (!$.fakeTerminal.command) {
        $.fakeTerminal.command = {};
    }
    // --------------------------------------------------------------------------
    /**
     * The "history" command
     * @param  {Object} instance The instance of fakeTerminal
     * @return {Object}
     */
    $.fakeTerminal.command.history = function(instance) {
        //  Extend the base command
        $.fakeTerminal.command._base.apply(this, arguments);
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
        base.info = function() {
            return {
                description: "Displays the command history, up to " + instance.options.historyLength + " items"
            };
        };
        // --------------------------------------------------------------------------
        /**
         * This method is called when fake terminal encounters the command which this
         * class represents
         * @param  {array} userArgs An array of arguments passed by the user
         * @return {Object}
         */
        base.execute = function(userArgs) {
            instance.addLine("  ");
            for (var i = 0; i < instance.history.length; i++) {
                instance.addLine(i + "  " + instance.history[i]);
            }
            instance.addLine("  ");
            //  Cleanly exit
            base.exit(0);
            return base;
        };
        // --------------------------------------------------------------------------
        return base;
    };
})(jQuery);
//# sourceMappingURL=faketerminal.js.map