/**
 * The output service
 * @return {Object}
 */
window.FakeTerminal.output = function (instance) {

    /**
     * Avoid scope issues by using `base` instead of `this`
     * @type {Object}
     */
    var base = this;

    // --------------------------------------------------------------------------

    /**
     * The screen element
     * @type {Object}
     */
    base.$screen = null;

    // --------------------------------------------------------------------------

    /**
     * Constructs window.FakeTerminal.output
     * @returns {Object}
     * @private
     */
    base.__construct = function () {
        base.$screen = $('<div>').addClass('faketerminal__screen');
        instance.$el.append(base.$screen);
        return base;
    };

    // --------------------------------------------------------------------------

    /**
     * Writes a line to base.$screen
     * @param   {String}  line   The line to write
     * @param   {Boolean} prompt Whether to include the prompt element
     * @returns {Object}         A reference to the class, for chaining
     */
    base.write = function (line, prompt) {

        var $line = $('<div>').addClass('faketerminal__screen__line');

        if (prompt) {
            $line.append(
                $('<div>')
                    .addClass('faketerminal__prompt')
                    .html(instance.getPrompt())
            );
        }

        //  Colorize and encode spaces so white space is maintained
        line = instance.colorize(line);
        line = line.replace(/ /g, '&nbsp;', line);
        line = line.replace(/<span&nbsp;class="/g, '<span class="', line);
        line = line.replace(/<div&nbsp;class="/g, '<div class="', line);

        $line.append(line);
        base.$screen.append($line);
        instance.scrollToBottom();
        return base;
    };

    // --------------------------------------------------------------------------

    /**
     * Clears all items from base.$screens
     * @returns {Object} A reference to the class, for chaining
     */
    base.clear = function () {
        base.$screen.empty();
        return base;
    };

    // --------------------------------------------------------------------------

    return base.__construct();
};
