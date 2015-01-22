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
        base.existing = "";
        base.commands = [];
        base.history = [];
        base.historyIndex = null;
        // --------------------------------------------------------------------------
        /**
         * Initialises the faketerminal
         * @return {void}
         */
        base.init = function() {
            //  Merge the options together
            base.options = $.extend({}, $.fakeTerminal.fakeTerminal.defaultOptions, options);
            //  Setup the terminal
            base.setup();
            //  Look for, and instanciate, commands
            base.registerCommands();
            //  focus the input
            base.focusInput();
            //  Run any initCommands
            for (var i = 0; i < base.options.initCommands.length; i++) {
                base.setCommand(base.options.initCommands[i]);
                base.enterCommand();
            }
        };
        // --------------------------------------------------------------------------
        /**
         * Sets up the fake terminal
         * @return {void}
         */
        base.setup = function() {
            //  Set all the appropriate classes
            base.$el.addClass("faketerminal");
            base.$el.addClass("faketerminal-" + base.options.theme);
            /**
             * Take a note of any existing text, we'll populate the terminal with
             * it once we're done setting up.
             */
            base.existing = base.$el.text().split("\n");
            //  Create the terminal body
            var header, headerButtons, headerButton, ul, li, prompt, input, requestInput;
            //  Is the terminal header
            header = $("<div>").addClass("ft-header");
            headerButtons = $("<ul>").addClass("ft-header-buttons");
            headerButton = [];
            headerButton[0] = $("<li>").addClass("ft-header-button ft-header-button-close");
            headerButton[1] = $("<li>").addClass("ft-header-button ft-header-button-minimise");
            headerButton[2] = $("<li>").addClass("ft-header-button ft-header-button-maximise");
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
            //  Set the prompt's value
            base.setPrompt();
            //  Bind listeners
            input.on("keydown", function(e) {
                switch (e.keyCode) {
                  //  Enter
                    case 13:
                    base.enterCommand();
                    break;

                  //  Up arrow
                    case 38:
                    base.browseHistory("UP");
                    break;

                  //  Down arrow
                    case 40:
                    base.browseHistory("DOWN");
                    break;
                }
            });
            //  Add the existing content
            $.each(base.existing, function(index, value) {
                base.addLine(value);
            });
        };
        // --------------------------------------------------------------------------
        base.setPrompt = function(host, user) {
            var prompt = base.$el.find(".ft-command .ft-prompt");
            var commandInput = base.$el.find(".ft-command .ft-input");
            var requestInput = base.$el.find(".ft-command .ft-request-input");
            host = typeof host === "undefined" || $.trim(host).length === 0 ? base.options.hostname : host;
            user = typeof user === "undefined" || $.trim(user).length === 0 ? base.options.username : user;
            user = user.toLowerCase().replace(/[^a-z0-9]/g, "");
            var text = host + ":~ " + user + "$ ";
            prompt.text(text);
            //  Resize the editable area to take up the remaining space
            commandInput.css("padding-left", prompt.outerWidth());
            requestInput.css("padding-left", prompt.outerWidth());
        };
        // --------------------------------------------------------------------------
        /**
         * Looks for available commands and registers them
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
            base.$el.find(">ul li.ft-command").before(li);
            //  Scroll the terminal window
            base.$el.find(">ul").scrollTop(base.$el.find(">ul").outerHeight());
            //  Return class for chaining
            return base;
        };
        // --------------------------------------------------------------------------
        /**
         * Handles when a command is entered
         * @return {Object} A reference to the class, for chaining
         */
        base.enterCommand = function() {
            var input = base.$el.find(">ul li.ft-command .ft-input");
            var value = input.text();
            // --------------------------------------------------------------------------
            //  Clear the input
            input.empty();
            // --------------------------------------------------------------------------
            var command, userArgs;
            command = value.split(" ").slice(0, 1);
            command = $.trim(command);
            userArgs = value.split(" ").slice(1);
            if (typeof base.commands[command] == "object") {
                /**
                 * Call the execute function. It is responsible for writing to the
                 * terminal screen.
                 */
                base.commands[command].execute(userArgs, base);
                base.$el.find(">ul li.ft-command .ft-input");
            } else {
                base.addLine('command not found: "' + command + '"');
            }
            // --------------------------------------------------------------------------
            //  Add to the history, and reset the history index
            base.history.push(value);
            base.historyIndex = null;
            // --------------------------------------------------------------------------
            return base;
        };
        // --------------------------------------------------------------------------
        /**
         * Sets a command in the prompt
         * @param {string} command The command to set
         * @return {Object}        A reference to the class, for chaining
         */
        base.setCommand = function(command) {
            var input = base.$el.find(">ul li.ft-command .ft-input");
            input.text(command);
            return base;
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
            base.setCommand(command);
            //  Move the cursor to the end of the string
            //  @todo
            return base;
        };
        // --------------------------------------------------------------------------
        /**
         * Request some input from the user
         * @param  {string} question The question to put to the user
         * @return {string}
         */
        base.requestInput = function(question, callbackMethod, callbackInstance) {
            //  Reset input
            var container = base.$el.find(">ul li.ft-command");
            var commandInput = base.$el.find(">ul li.ft-command .ft-input");
            var requestInput = base.$el.find(">ul li.ft-command .ft-request-input");
            var value = "";
            //  Show input
            container.addClass("ft-request-input");
            //  Show the question
            base.addLine(question);
            //   Bind listener
            base.focusRequestInput();
            $(requestInput).off("keydown");
            $(requestInput).on("keydown", function(e) {
                var returnVal = true;
                switch (e.keyCode) {
                  //  Enter
                    case 13:
                    //  Get the user's response
                    value = $.trim(requestInput.text());
                    //  Reset the input
                    base.focusInput();
                    //  Execute the callback
                    callbackInstance[callbackMethod](value);
                    //  False return val
                    returnVal = false;
                    break;
                }
                return returnVal;
            });
        };
        // --------------------------------------------------------------------------
        /**
         * Destroys the fake terminal, reverting it back to its previous state
         * @return {Object} A reference to the class, for chaining
         */
        base.destroy = function() {
            base.$el.empty();
            base.$el.html(base.existing);
            return base;
        };
        // --------------------------------------------------------------------------
        base.focusInput = function() {
            var container = base.$el.find(">ul li.ft-command");
            var input = base.$el.find(">ul li.ft-command .ft-input");
            container.removeClass("ft-request-input");
            input.empty().focus();
            return base;
        };
        // --------------------------------------------------------------------------
        base.focusRequestInput = function() {
            var container = base.$el.find(">ul li.ft-command");
            var input = base.$el.find(">ul li.ft-command .ft-request-input");
            container.addClass("ft-request-input");
            input.empty().focus();
            return base;
        };
        // --------------------------------------------------------------------------
        // Run initializer
        base.init();
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
        initCommands: [ "welcome" ]
    };
    // --------------------------------------------------------------------------
    /**
     * The base command object, commands should extend this object
     * @return {Object}
     */
    $.fakeTerminal.command._base = function() {
        /**
         * To avoid scope issues, use 'base' instead of 'this' to reference
         * this class from internal events and functions.
         */
        var base = this;
        /**
         * Describes the command
         * @param  {Object} instance  The fakeTerminal instance
         * @return {Object}
         */
        base.info = function(instance) {
            return {
                "private": true
            };
        };
        // --------------------------------------------------------------------------
        /**
         * This method is called when fake terminal encounters the command which this class represents
         * @param  {array}  userArgs An array of arguments passed by the user
         * @param  {Object} instance The fakeTerminal instance
         * @return {array}           An array of lines to render to the screen
         */
        base.execute = function(userArgs, instance) {
            return [];
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
    $.fakeTerminal.command.echo = function(instance) {
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
         * This method is called when fake terminal encounters the command which this class represents
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
            instance.addLine(returnVal);
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
         * This method is called when fake terminal encounters the command which this class represents
         * @param  {array} userArgs An array of arguments passed by the user
         * @return {Object}
         */
        base.execute = function(userArgs) {
            var returnVal = [];
            var commandInfo = {};
            var temp;
            if (userArgs.length === 0) {
                returnVal.push('The following commands are available, run <span class="ft-comment">help [command]</span> to find out more.');
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
                        console.log(typeof commandInfo.private);
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
         * This method is called when fake terminal encounters the command which this class represents
         * @param  {array} userArgs An array of arguments passed by the user
         * @return {Object}
         */
        base.execute = function(userArgs) {
            instance.addLine("  ");
            for (var i = 0; i < instance.history.length; i++) {
                instance.addLine(i + "  " + instance.history[i]);
            }
            return base;
        };
        // --------------------------------------------------------------------------
        return base;
    };
})(jQuery);
//# sourceMappingURL=faketerminal.js.map