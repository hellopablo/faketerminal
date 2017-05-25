(function ($) {
    /**
     * Register plugin with jQuery
     * @param  {Object} options Overrides default options
     * @return {Object}         The instance of this class.
     */
    $.fn.faketerminal = function (options) {
        return this.each(function () {
            $(this)
                .data(
                    'instance',
                    new window.FakeTerminal.main(this, options)
                );
        });
    };

})(jQuery);
