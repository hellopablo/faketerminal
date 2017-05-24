//  Namespace; create if not defined
if (!window.FakeTerminal) {
    window.FakeTerminal = {};
}

if (!window.FakeTerminal.command) {
    window.FakeTerminal.command = {};
}

/**
 * The default options
 * @type {Object}
 */
window.FakeTerminal.defaultOptions = {
    //  The user's username
    username: "root",
    //  The hostname
    hostname: window.location.host,
    //  How many history items to save
    history: 1e3,
    //  The prompt pattern
    prompt: "[%username%@%hostname%: %cwd%] ",
    //  Any commands to run on "login"
    login: null,
    //  The user's current working directory
    cwd: "~"
};

/**
 * The main FakeTerminal class
 * @param el
 * @param options
 * @returns {window.FakeTerminal}
 */
window.FakeTerminal.main = function(el, options) {
    /**
     * To avoid scope issues, use 'base' instead of 'this' to reference
     * this class from internal events and functions.
     */
    var base = this;
    if (!jQuery) {
        throw "FakeTerminal: jQuery required";
    } else {
        var $ = jQuery;
    }
    // Access to jQuery and DOM versions of element
    base.$el = $(el);
    base.el = el;
    // --------------------------------------------------------------------------
    //  Field variables
    base.originalHtml = "";
    base.existingText = [];
    base.executingCommand = {
        instance: null,
        deferred: null
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
    base.output = null;
    base.input = null;
    base.filesystem = null;
    base.history = null;
    // --------------------------------------------------------------------------
    /**
     * Constructs the FakeTerminal
     * @return {void}
     */
    base.__construct = function() {
        //  Merge the options together
        base.options = $.extend({}, window.FakeTerminal.defaultOptions, options);
        //  Copy the original markup so we can destroy nicely
        base.originalHtml = base.el.outerHTML;
        base.existingText = base.el.innerHTML ? base.el.innerHTML.split("\n") : [];
        //  Prepare the element
        base.$el.addClass("faketerminal").empty();
        //  Bind listeners
        base.bindListeners();
        //  Construct the core classes
        base.output = new window.FakeTerminal.output(base);
        base.input = new window.FakeTerminal.input(base);
        base.filesystem = new window.FakeTerminal.filesystem(base);
        base.history = new window.FakeTerminal.history(base);
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
    base.bindListeners = function() {
        base.$el.on("click", function() {
            base.input.focus();
        }).on("keyup", function(e) {
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
    base.findCommand = function(command) {
        var cmdInstance;
        if (typeof window.FakeTerminal.command[command] === "function") {
            cmdInstance = new window.FakeTerminal.command[command](base);
        }
        return cmdInstance;
    };
    // --------------------------------------------------------------------------
    /**
     * Sets the value of the prompt automatically
     * @return {String}
     */
    base.getPrompt = function() {
        var hostname, username, cwd, text;
        //  Determine values
        if (typeof base.options.hostname === "function") {
            hostname = base.options.hostname.call();
        } else {
            hostname = base.options.hostname;
        }
        if (typeof base.options.username === "function") {
            username = base.options.username.call();
        } else {
            username = base.options.username;
        }
        if (typeof base.options.cwd === "function") {
            cwd = base.options.cwd.call();
        } else {
            cwd = base.options.cwd;
        }
        //  Ensure the username is lowercase, alpha-numeric
        username = username.toLowerCase().replace(/[^a-z0-9]/g, "");
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
        line = line.replace(/<\/([a-zA-Z].+)>/g, "</span>", line);
        return line;
    };
    // --------------------------------------------------------------------------
    base.scrollToBottom = function() {
        base.$el.scrollTop(base.$el.get(0).scrollHeight);
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
    /**
     * Executes a command
     * @param  {String}  commandString The command to execute
     * @param  {Boolean} hidden        Whether the commands are added to the command history
     * @return {Object}                A reference to the class, for chaining
     */
    base.exec = function(commandString, hidden) {
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
        command = $.trim(commandString.split(" ").slice(0, 1));
        userArgs = commandString.split(" ").slice(1);
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
            base.executingCommand.deferred = commandInstance.execute.apply(commandInstance, userArgs).done(function() {
                deferred.resolve(arguments);
            }).fail(function() {
                deferred.reject(arguments);
            }).always(function() {
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
        base.$el.trigger("ft:command", [ base, command ]);
        return deferred.promise();
    };
    // --------------------------------------------------------------------------
    // Run constructor
    base.__construct();
};

window.FakeTerminal.output = function(instance) {
    var base = this;
    // --------------------------------------------------------------------------
    base.screen = null;
    // --------------------------------------------------------------------------
    base.__construct = function() {
        base.screen = $("<div>").addClass("faketerminal__screen");
        instance.$el.append(base.screen);
        return base;
    };
    // --------------------------------------------------------------------------
    base.write = function(line, prompt) {
        var $line = $("<div>").addClass("faketerminal__screen__line");
        if (prompt) {
            $line.append($("<div>").addClass("faketerminal__prompt").html(instance.getPrompt()));
        }
        //  Colorize and encode spaces so white space is maintained
        line = instance.colorize(line);
        line = line.replace(/ /g, "&nbsp;", line);
        line = line.replace(/<span&nbsp;class="/g, '<span class="', line);
        line = line.replace(/<div&nbsp;class="/g, '<div class="', line);
        $line.append(line);
        base.screen.append($line);
        instance.scrollToBottom();
        return base;
    };
    // --------------------------------------------------------------------------
    base.clear = function() {
        base.screen.empty();
    };
    // --------------------------------------------------------------------------
    return base.__construct();
};

window.FakeTerminal.input = function(instance) {
    var base = this;
    // --------------------------------------------------------------------------
    base.$input = null;
    base.$commandLine = null;
    // --------------------------------------------------------------------------
    base.__construct = function() {
        base.$prompt = $("<div>").addClass("faketerminal__prompt").html(instance.getPrompt());
        base.$input = $("<input>").on("keyup", function(e) {
            switch (e.which) {
              case instance.keymap.ENTER:
                instance.exec(base.read()).done(function() {
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
        base.$commandLine = $("<div>").addClass("faketerminal__commandline");
        instance.$el.append(base.$commandLine.append(base.$prompt).append(base.$input));
        return base;
    };
    // --------------------------------------------------------------------------
    base.read = function() {
        var value = base.$input.val();
        base.$input.val("");
        return value;
    };
    // --------------------------------------------------------------------------
    base.set = function(command) {
        base.$input.val(command);
    };
    // --------------------------------------------------------------------------
    base.focus = function() {
        base.$input.focus();
    };
    // --------------------------------------------------------------------------
    base.enable = function() {
        base.$commandLine.show();
        return base;
    };
    // --------------------------------------------------------------------------
    base.disable = function() {
        base.$commandLine.hide();
        return base;
    };
    // --------------------------------------------------------------------------
    base.ctrl = function(letter) {
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
    base.ctrlC = function() {
        /**
         * If a command is executing reject it and show some feedback; if not
         * just repeat the prompt
         */
        if (instance.executingCommand.instance) {
            instance.executingCommand.instance.terminate();
            instance.executingCommand.instance = null;
            instance.executingCommand.deferred = null;
            instance.output.write("^C", true);
        } else {
            var value = base.read();
            if (value.length) {
                instance.output.write(value, true);
                instance.output.write("^C", true);
            }
            instance.output.write("", true);
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
    base.ctrlU = function() {
        base.$input.val("");
        return base;
    };
    // --------------------------------------------------------------------------
    return base.__construct();
};

window.FakeTerminal.filesystem = function(instance) {
    var base = this;
    // --------------------------------------------------------------------------
    base.__construct = function() {
        return base;
    };
    // --------------------------------------------------------------------------
    return base.__construct();
};

window.FakeTerminal.history = function(instance) {
    var base = this;
    // --------------------------------------------------------------------------
    base.counter = 0;
    base.items = [];
    base.browseIndex = null;
    // --------------------------------------------------------------------------
    base.__construct = function() {
        return base;
    };
    // --------------------------------------------------------------------------
    base.push = function(command) {
        base.counter++;
        base.items.push({
            counter: base.counter,
            command: command
        });
        if (base.items.length > instance.options.history) {
            base.items = base.items.slice(base.items.length - instance.options.history);
        }
    };
    // --------------------------------------------------------------------------
    /**
     * Browse through the command history
     * @param  {string} direction Whether to go UP or DOWN through history
     * @return {Object}           A reference to the class, for chaining
     */
    base.browse = function(direction) {
        if (direction === instance.keymap.UP) {
            /**
             * Going up through the history. if browseIndex is null then set it
             * to the end of history array.
             */
            if (base.browseIndex === null) {
                base.browseIndex = base.items.length;
            }
            //  Go down an index
            base.browseIndex--;
            //  Don't go below 0
            if (base.browseIndex < 0) {
                base.browseIndex = 0;
            }
        } else if (direction === instance.keymap.DOWN) {
            /**
             * Going down through the history. if browseIndex is null then set it
             * to the beginning of the history array
             */
            if (base.browseIndex === null) {
                base.browseIndex = 0;
            }
            //  Go up an index
            base.browseIndex++;
            //  Don't go beyond the limits!
            if (base.browseIndex >= base.items.length) {
                base.browseIndex = base.items.length;
            }
        }
        // --------------------------------------------------------------------------
        //  Get the command
        if (base.items[base.browseIndex]) {
            return base.items[base.browseIndex].command;
        } else {
            return null;
        }
    };
    // --------------------------------------------------------------------------
    return base.__construct();
};

/**
 * The base command object, commands should extend this object
 * @return {Object}
 */
window.FakeTerminal.command._base = function(instance) {
    /**
     * To avoid scope issues, use 'base' instead of 'this' to reference
     * this class from internal events and functions.
     */
    var base = this;
    // --------------------------------------------------------------------------
    /**
     * The commands main deferred object; this is resolved or rejected when the
     * command completes
     * @type {$.Deferred}
     */
    base.deferred = new $.Deferred();
    // --------------------------------------------------------------------------
    /**
     * Describes the command
     * @return {Object}
     */
    base.info = function() {
        return {
            private: true
        };
    };
    // --------------------------------------------------------------------------
    /**
     * This method is called when fake terminal encounters the command which this class represents
     * @param  {Array} userArgs An array of arguments passed by the user
     * @return {Object}          An array of lines to render to the screen
     */
    base.execute = function(userArgs) {
        base.deferred.resolve();
        return base.deferred.promise();
    };
    // --------------------------------------------------------------------------
    /**
     * Called if the command is terminated with CTL+C; useful for cleaning up
     */
    base.terminate = function() {
        base.deferred.reject();
    };
};

/**
 * The "clear" command
 * @param  {Object} instance The instance of FakeTerminal
 * @return {Object}
 */
window.FakeTerminal.command.clear = function(instance) {
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
    base.info = function() {
        return {
            description: "Clears the screen"
        };
    };
    // --------------------------------------------------------------------------
    /**
     * This method is called when FakeTerminal encounters the command which this
     * class represents
     * @return {Object}
     */
    base.execute = function() {
        instance.output.clear();
        base.deferred.resolve();
        return base.deferred.promise();
    };
    // --------------------------------------------------------------------------
    return base;
};

/**
 * The "echo" command
 * @param  {Object} instance The instance of FakeTerminal
 * @return {Object}
 */
window.FakeTerminal.command.echo = function(instance) {
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
    base.info = function() {
        return {
            description: "Writes an argument to the standard output"
        };
    };
    // --------------------------------------------------------------------------
    /**
     * This method is called when FakeTerminal encounters the command which this
     * class represents
     * @return {Object}
     */
    base.execute = function() {
        var args = $.makeArray(arguments);
        var returnVal;
        //  Merge all the arguments
        returnVal = args.join(" ");
        returnVal = $.trim(returnVal);
        //  Remove quotes
        returnVal = returnVal.replace(/["']/g, "");
        returnVal = returnVal.replace(/["']/g, "");
        //  Ensure we write *something* to the screen
        if (returnVal.length === 0) {
            returnVal = " ";
        }
        //  Write to the terminal
        instance.output.write(returnVal);
        base.deferred.resolve();
        return base.deferred.promise();
    };
    // --------------------------------------------------------------------------
    return base;
};

/**
 * The "help" command
 * @param  {Object} instance The instance of FakeTerminal
 * @return {Object}
 */
window.FakeTerminal.command.help = function(instance) {
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
    base.info = function() {
        return {
            description: "Displays information about the available commands"
        };
    };
    // --------------------------------------------------------------------------
    /**
     * This method is called when FakeTerminal encounters the command which this
     * class represents
     * @return {Object}
     */
    base.execute = function() {
        var returnVal = [];
        var commandInfo = {};
        if (arguments.length === 0) {
            returnVal.push("The following commands are available, run <info>help [command]</info> to find out more.");
            returnVal.push(" ");
            var commandString = "";
            $.each(window.FakeTerminal.command, function(command) {
                var temp = instance.findCommand(command);
                if (!temp) {
                    return;
                }
                //  Check to see if the command is private
                if (typeof temp.info === "function") {
                    commandInfo = temp.info();
                    if (typeof commandInfo.private === "boolean" && commandInfo.private === true) {
                        return;
                    }
                }
                commandString += command + "    ";
            });
            returnVal.push(commandString);
            returnVal.push(" ");
        } else {
            var command = instance.findCommand(arguments[0]);
            if (command) {
                if (typeof command.info === "function") {
                    commandInfo = command.info();
                    if (typeof commandInfo.description === "string") {
                        returnVal = [ " ", arguments[0] + " -- <comment>" + commandInfo.description + "</comment>", " " ];
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
            instance.output.write(returnVal[i]);
        }
        base.deferred.resolve();
        return base.deferred.promise();
    };
    // --------------------------------------------------------------------------
    return base;
};

// --------------------------------------------------------------------------
/**
 * The "man" command, an alias of "help"
 * @return {Object}
 */
window.FakeTerminal.command.man = function() {
    window.FakeTerminal.command.help.apply(this, arguments);
    return this;
};

/**
 * The "history" command
 * @param  {Object} instance The instance of FakeTerminal
 * @return {Object}
 */
window.FakeTerminal.command.history = function(instance) {
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
    base.info = function() {
        return {
            description: "Displays the command history, up to " + instance.options.historyLength + " items"
        };
    };
    // --------------------------------------------------------------------------
    /**
     * This method is called when FakeTerminal encounters the command which this
     * class represents
     * @return {Object}
     */
    base.execute = function() {
        instance.output.write("  ");
        for (var i = 0; i < instance.history.items.length; i++) {
            instance.output.write(instance.history.items[i].counter + "  " + instance.history.items[i].command);
        }
        instance.output.write("  ");
        base.deferred.resolve();
        return base.deferred.promise();
    };
    // --------------------------------------------------------------------------
    return base;
};

/**
 * The "sleep" command
 * @param  {Object} instance The instance of FakeTerminal
 * @return {Object}
 */
window.FakeTerminal.command.sleep = function(instance) {
    //  Extend the base command
    window.FakeTerminal.command._base.apply(this, arguments);
    /**
     * To avoid scope issues, use 'base' instead of 'this' to reference
     * this class from internal events and functions.
     */
    var base = this;
    // --------------------------------------------------------------------------
    base.timeout = null;
    // --------------------------------------------------------------------------
    /**
     * Describes the command
     * @return {Object}
     */
    base.info = function() {
        return {
            description: "Does nothing for a short while"
        };
    };
    // --------------------------------------------------------------------------
    /**
     * This method is called when FakeTerminal encounters the command which this
     * class represents
     * @return {Object}
     */
    base.execute = function() {
        var duration = 0;
        if (arguments.length) {
            duration = parseInt(arguments[0]);
        }
        instance.output.write("Sleeping for " + duration + " seconds...");
        base.timeout = setTimeout(function() {
            instance.output.write("awake!");
            base.deferred.resolve();
        }, duration * 1e3);
        return base.deferred.promise();
    };
    // --------------------------------------------------------------------------
    /**
     * Called if the command is terminated with CTL+C; useful for cleaning up
     */
    base.terminate = function() {
        clearTimeout(base.timeout);
        base.deferred.reject();
    };
    // --------------------------------------------------------------------------
    return base;
};

/**
 * The "whoami" command
 * @param  {Object} instance The instance of FakeTerminal
 * @return {Object}
 */
window.FakeTerminal.command.whoami = function(instance) {
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
    base.info = function() {
        return {
            description: "Prints the user's username to standard output"
        };
    };
    // --------------------------------------------------------------------------
    /**
     * This method is called when FakeTerminal encounters the command which this
     * class represents
     * @return {Object}
     */
    base.execute = function() {
        instance.output.write(instance.options.username);
        base.deferred.resolve();
        return base.deferred.promise();
    };
    // --------------------------------------------------------------------------
    return base;
};

(function($) {
    /**
     * Register plugin with jQuery
     * @param  {Object} options Overrides default options
     * @return {Object}         The instance of this class.
     */
    $.fn.faketerminal = function(options) {
        return this.each(function() {
            $(this).data("instance", new window.FakeTerminal.main(this, options));
        });
    };
})(jQuery);
//# sourceMappingURL=faketerminal.js.map