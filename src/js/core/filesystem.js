/**
 * The filesystem service
 * @return {Object}
 */
window.FakeTerminal.filesystem = function (instance) {

    /**
     * Avoid scope issues by using `base` instead of `this`
     * @type {Object}
     */
    var base = this;

    // --------------------------------------------------------------------------

    /**
     * Constructs window.FakeTerminal.filesystem
     * @returns {Object}
     * @private
     */
    base.__construct = function() {
        return base;
    };

    // --------------------------------------------------------------------------

    return base.__construct();
};
