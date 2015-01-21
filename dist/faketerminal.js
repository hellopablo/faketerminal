(function($) {
    if (!$.shed) {
        $.shed = new Object();
    }
    $.shed.faketerminal = function(el, options) {
        // To avoid scope issues, use 'base' instead of 'this'
        // to reference this class from internal events and functions.
        var base = this;
        // Access to jQuery and DOM versions of element
        base.$el = $(el);
        base.el = el;
        // Add a reverse reference to the DOM object
        base.$el.data("shed.faketerminal", base);
        base.init = function() {
            base.options = $.extend({}, $.shed.faketerminal.defaultOptions, options);
        };
        // Sample Function, Uncomment to use
        // base.functionName = function(paramaters){
        //
        // };
        // Run initializer
        base.init();
    };
    $.shed.faketerminal.defaultOptions = {};
    $.fn.shed_faketerminal = function(options) {
        return this.each(function() {
            new $.shed.faketerminal(this, options);
        });
    };
})(jQuery);
//# sourceMappingURL=faketerminal.js.map