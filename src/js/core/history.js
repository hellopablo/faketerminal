window.FakeTerminal.history = function (instance) {

    var base = this;

    // --------------------------------------------------------------------------

    base.counter     = 0;
    base.items       = [];
    base.browseIndex = null;

    // --------------------------------------------------------------------------

    base.__construct = function () {
        return base;
    };

    // --------------------------------------------------------------------------

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
