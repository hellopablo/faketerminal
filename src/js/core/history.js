/**
 * The history service
 * @return {Object}
 */
window.FakeTerminal.history = function (instance) {

    /**
     * Avoid scope issues by using `base` instead of `this`
     * @type {Object}
     */
    var base = this;

    // --------------------------------------------------------------------------

    /**
     * Tracks the number of previously executed commands
     * @type {number}
     */
    base.counter = 0;

    /**
     * An array of all the previously executed commands
     * @type {Array}
     */
    base.items = [];

    /**
     * Tracks the user's position when browsing items using the arrow keys
     * @type {null}
     */
    base.browseIndex = null;

    // --------------------------------------------------------------------------

    /**
     * Constructs window.FakeTerminal.history
     * @returns {Object}
     * @private
     */
    base.__construct = function () {
        return base;
    };

    // --------------------------------------------------------------------------

    /**
     * Pushes a new command onto the history array
     * @param {String} command The command which was executed
     */
    base.push = function (command) {
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
    base.browse = function (direction) {

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
