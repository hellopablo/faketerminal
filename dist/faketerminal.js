(function($) {
    if (!$.shed) {
        $.shed = new Object();
    }
    // --------------------------------------------------------------------------
    $.shed.fakeTerminal = function(el, options) {
        /**
         * To avoid scope issues, use 'base' instead of 'this' to reference
         * this class from internal events and functions.
         */
        var base = this;
        // Access to jQuery and DOM versions of element
        base.$el = $(el);
        base.el = el;
        // Add a reverse reference to the DOM object
        base.$el.data("shed.fakeTerminal", base);
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
            base.options = $.extend({}, $.shed.fakeTerminal.defaultOptions, options);
            //  Setup the terminal
            base.setup();
            //  Look for, and instanciate, commands
            base.registerCommands();
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
            var ul, li, prompt, input;
            //  contains all the terminal "lines"
            ul = $("<ul>");
            //  Contains the main prompt
            li = $("<li>").addClass("ft-command");
            //  The text shown before the input
            prompt = $("<span>").addClass("ft-prompt").text(base.options.hostname + ":~ " + base.options.username + "$ ");
            //  The actual input, i.e., where the user types commands
            input = $("<span>").addClass("ft-input").prop("contenteditable", true);
            //  Glue altogether and add to the DOM
            base.$el.empty().append(ul.append(li.append(prompt).append(input)));
            //  Resize the editable area to take up the remaining space
            input.css("padding-left", prompt.outerWidth());
            //  Bind listener
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
        /**
         * Looks for available commands and registers them
         * @return {void}
         */
        base.registerCommands = function() {
            if (typeof $.shed.fakeTerminalCommand === "object") {
                $.each($.shed.fakeTerminalCommand, function(index, element) {
                    base.commands[index] = new element();
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
            var line = $.parseHTML(line);
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
            base.$el.scrollTop(base.$el.outerHeight());
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
            var command = value.split(" ").slice(0, 1);
            var arguments = value.split(" ").slice(1);
            var lines = [];
            if (typeof base.commands[command] == "object") {
                lines = base.commands[command].execute(arguments);
            } else {
                lines = [ 'command not found: "' + command + '"' ];
            }
            // --------------------------------------------------------------------------
            //  Wrote to the faketerminal screen
            if (typeof lines === "string") {
                base.addLine(lines);
            } else if (typeof lines === "number") {
                base.addLine(lines);
            } else {
                $.each(lines, function(index, line) {
                    base.addLine(line);
                });
            }
            // --------------------------------------------------------------------------
            //  Add to the history, and reset the history index
            base.history.push(value);
            base.historyIndex = null;
            // --------------------------------------------------------------------------
            //  Clear the input
            input.empty();
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
         * Destroys the fake terminal, reverting it back to its previous state
         * @return {Object} A reference to the class, for chaining
         */
        base.destroy = function() {
            base.$el.empty();
            base.$el.html(base.existing);
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
    $.shed.fakeTerminal.defaultOptions = {
        theme: "default",
        username: "root",
        hostname: window.location.host
    };
    // --------------------------------------------------------------------------
    /**
     * Register plugin with jQuery
     * @param  {Object} options Overrides default options
     * @return {Object}         The instance of this class.
     */
    $.fn.faketerminal = function(options) {
        return this.each(function() {
            new $.shed.fakeTerminal(this, options);
        });
    };
})(jQuery);

(function($) {
    if (!$.shed) {
        $.shed = new Object();
    }
    if (!$.shed.fakeTerminalCommand) {
        $.shed.fakeTerminalCommand = new Object();
    }
    $.shed.fakeTerminalCommand.echo = function() {
        /**
         * To avoid scope issues, use 'base' instead of 'this' to reference
         * this class from internal events and functions.
         */
        var base = this;
        // --------------------------------------------------------------------------
        //  field variables
        base.counter = 0;
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
         * @param  {array} arguments An array of arguments passed by the user
         * @return {array}           An array of lines to render to the screen
         */
        base.execute = function(arguments) {
            var returnVal;
            //  Merge all the arguments
            returnVal = arguments.join(" ");
            //  Remove quotes
            returnVal = returnVal.replace(/["']/g, "");
            returnVal = returnVal.replace(/["']/g, "");
            return returnVal;
        };
    };
})(jQuery);

(function($) {
    if (!$.shed) {
        $.shed = new Object();
    }
    if (!$.shed.fakeTerminalCommand) {
        $.shed.fakeTerminalCommand = new Object();
    }
    $.shed.fakeTerminalCommand.help = function() {
        /**
         * To avoid scope issues, use 'base' instead of 'this' to reference
         * this class from internal events and functions.
         */
        var base = this;
        // --------------------------------------------------------------------------
        //  field variables
        base.counter = 0;
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
         * @param  {array}  arguments An array of arguments passed by the user
         * @return {array}            An array of lines to render to the screen
         */
        base.execute = function(arguments) {
            var returnVal = [];
            if (arguments.length === 0) {
                returnVal.push('The following commands are available, run <span class="ft-comment">help [command]</span> to find out more.');
                returnVal.push(" ");
                var commandString = "";
                $.each($.shed.fakeTerminalCommand, function(index, value) {
                    commandString += index + "    ";
                });
                returnVal.push(commandString);
                returnVal.push(" ");
            } else {
                var command = arguments[0];
                var isValidCommand = false;
                $.each($.shed.fakeTerminalCommand, function(index, value) {
                    if (index === command) {
                        isValidCommand = true;
                    }
                });
                if (isValidCommand) {
                    var temp = new $.shed.fakeTerminalCommand[command]();
                    if (typeof temp.info == "function") {
                        var info = temp.info();
                        if (typeof info.description == "string") {
                            returnVal = [ " ", command + " -- " + info.description, " " ];
                        } else if (typeof info.description == "array") {
                            returnVal = info.description;
                        }
                    }
                    if (returnVal.length === 0) {
                        returnVal = [ " ", 'No description for "' + command + '"', " " ];
                    }
                } else {
                    returnVal = [ " ", '"' + command + '" is not a valid command', " " ];
                }
            }
            return returnVal;
        };
    };
})(jQuery);
//# sourceMappingURL=faketerminal.js.map