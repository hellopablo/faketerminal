# FakeTerminal

A fake Javascript terminal for your website. [Demo](http://jquery.hellopablo.co.uk/faketerminal)


## How to use

### Basic Usage

The easiest way to install faketerminal.js is via [Bower](http://bower.io).

    bower install faketerminal

Include the JS and the CSS in your page

    <!-- CSS -->
    <link href="/bower_components/faketerminal/dist/faketerminal.css" media="all" rel="stylesheet" type="text/css" />

    <!-- JS -->
    <script src="/bower_components/jquery/dist/jquery.min.js" type="text/javascript"></script>
    <script src="/bower_components/faketerminal/dist/faketerminal.min.js" type="text/javascript"></script>

Instantiate faketerminal on an empty `<div>`

    $('#myFaketerminal').faketerminal({
        options: '@todo'
    });


## Options

The following options are available to you:

[@todo]


## Adding Commands

Easily extend the basic set of commands which faketerminal responds to by ... [@todo]


## How to Contribute

Compile faketerminal.js using Grunt.

Install `grunt-cli` globally.

    npm install -g grunt-cli

Call `grunt` in the project root

    cd /path/to/project
    grunt

Changes made to the LESS and JS will be compiled automatically