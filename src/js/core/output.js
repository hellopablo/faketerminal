window.FakeTerminal.output = function (instance) {

    var base = this;

    // --------------------------------------------------------------------------

    base.screen = null;

    // --------------------------------------------------------------------------

    base.__construct = function () {
        base.screen = $('<div>').addClass('faketerminal__screen');
        instance.$el.append(base.screen);
        return base;
    };

    // --------------------------------------------------------------------------

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
        base.screen.append($line);
        instance.scrollToBottom();
        return base;
    };

    // --------------------------------------------------------------------------

    base.clear = function () {
        base.screen.empty();
    };

    // --------------------------------------------------------------------------

    return base.__construct();
};
