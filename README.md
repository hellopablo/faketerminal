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

    $('#faketerminal').faketerminal({
        username: 'pablo',
        hostname: 'hellopablo.co.uk'
    });



## Options

The following options are available to you:

```
{
    //  The user's username
    username: 'root',

    //  The hostname
    hostname: window.location.host,

    //  How many history items to save
    history: 1000,

    //  The prompt pattern
    prompt: '[%username%@%hostname%: %cwd%] ',

    //  Any commands to run on "login"
    login: null,

    //  The user's current working directory
    cwd: '~'
}
```

**Note:** The `username`, `hostname` and `cwd` options can all be functions if you require dynamic behaviour.



## Adding Commands

Commands exist within the `window.FakeTerminal` namespace and must extend `window.FakeTerminal.command`. Commands are comprised of 3 main methods: `execute()`, `info()` and `terminate()`.

### `execute()`

Called when the command is executed. The parent class contains a Deferred object (at `base.deferred`) which should be resolved, or rejected, when the command has finished executing.  

Note that user input will be disabled while a command is running (unless explicitly requested by the command using the `instance.input.request()` method).

The command will be passed any arguments as parameters; arguments are deliminated by a space so, for example: `mycommand foo bar` will receive `foo` and `bar` as parameters one and two.

### `info()`

This method returns information about the command which is used by things such as the `history` command. It can contain the following properties:

- `private` - Whether the command should be reported by the `help`
- `description` - A brief description of the command for use within `help`


### `terminate()`

Called when the command must be terminated early (e.g. when the user pressed ctrl+C). This method will reject the base deferred promise and provides an opportunity for the command to clean up or terminate any processes.



### Sample Command

```
window.FakeTerminal.command.myCommand = function (instance) {

    //  Extend the base command
    window.FakeTerminal.command.apply(this, arguments);

    var base = this;

    base.info = function () {
        return {
            private: false,
            description: 'This command doesn\'t do anything terribly exciting'
        };
    };

    base.execute = function (foo, bar) {
        instance.output.write('The value of foo is: ' + foo);
        instance.output.write('The value of bar is: ' + bar);
        base.deferred.resolve();
        return base.deferred.promise();
    };

    return base;
};
```



## Requesting user input

At any point in your commands you can request user input in any of the following ways:

```
instance.request()
instance.requestBool()
instance.requestPassword()
```

All of the above will return a promise which is resolved when the user hits the Enter key. The value will be passed into callback as the only parameter.

In the case of `requestBool()` the promise will be resolved or rejected depending on the user's response, a resolve for a truthy response, rejected for a non-truthy response.

`requestPassword()` behaves identically to `request()` but does not show the type response, nor does it print it to the output.


## Colouring Output

You can colour the output (including the prompt) by wrapping text in any of the following tags:

```
<info></info>
<error></error>
<comment></comment>
<question></question>
<muted></muted>
```

In addition, the following tag will draw a full width horizontal line across the screen

```
<line></line>
```


## Events

FakeTerminal fires the following events:

- `ft:init (<instance>)` - fired just as an instance is created
- `ft:ready (<instance))` - fired once the instance is ready, but before any commands have been executed
- `ft:command (<instance>, <command>)` - fired after user input be that a command or the response to a request for input 
- `ft:destroy (<instance>)` - fired when the instance destroys itself


## How to Contribute

I welcome contributions to FakeTerminal. Fork the repo and submit a pull request. Please ensure that faketerminal.js compiles and that any relevant documentation is updated before sending the pull request. If you want to write some tests then that would be very welcomed!



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

- [ ] Support a virtual file system
- [ ] Draggable window
- [ ] Some form of `sudo` support
