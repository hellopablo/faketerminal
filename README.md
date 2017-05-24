# FakeTerminal

A fake Javascript terminal for your website - [Demo](http://hellopablo.github.io/faketerminal/)


## Installation

The easiest way to install faketerminal.js is via [Bower](http://bower.io).

    bower install faketerminal

Include the JS and the CSS in your page

    <!-- CSS -->
    <link href="/bower_components/faketerminal/dist/faketerminal.css" media="all" rel="stylesheet" type="text/css" />

    <!-- JS -->
    <script src="/bower_components/jquery/dist/jquery.min.js" type="text/javascript"></script>
    <script src="/bower_components/faketerminal/dist/faketerminal.min.js" type="text/javascript"></script>

Instantiate FakeTerminal on an empty `<div>`

    $('#myFaketerminal').faketerminal({
        username: 'pablo',
        hostname: 'hellopablo.co.uk'
    });



## Options

The following options are available to you:

```
{
    //  Which theme to skin the console with
    'theme': 'default',

    //  The user's username
    'username': 'root',

    //  The hostname
    'hostname': functwindow.location.host,

    //  How many history items to save
    'historyLength': 1000,
    
    //  The prompt pattern
    'prompt': '%hostname%: %cwd% %username%$',

    //  Any commands to run on "login"
    'loginCommand': null,

    //  The user's current working directory
    'cwd': '~'
}
```

**Note:** The `username`, `hostname`, `loginCommand` and `initDir` can all be functions if you require dynamic behaviour



## Adding Commands

> @todo - write this part of the docs



## How to Contribute

I welcome contributions to FakeTerminal. Fork the repo and submit a pull request. Please ensure that faketerminal.js
compiles and that any relevant documentation is updated before sending the pull request.



### Compiling CSS and JS

This project uses Grunt to compile CSS and JS. You'll need `grunt-cli` installed:

    npm install -g grunt-cli

Install the dev dependencies

    npm install

Call `grunt` in the project root to compile assets and then watch for changes

    grunt

If you simply wish to build (and not watch) then you can use:

    grunt build

All the Less and JS files will be watched for changes, and compiled if necessary.



### @todo

- [ ] Complete this README.md
- [ ] Support a virtual file system
- [ ] Move input/output to their relevant classes
