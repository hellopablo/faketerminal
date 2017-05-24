/**
 * The default options
 * @type {Object}
 */
window.FakeTerminal.defaultOptions = {

    //  Which theme to skin the console with
    'theme': 'default',

    //  The user's username
    'username': 'root',

    //  The hostname
    'hostname': window.location.host,

    //  How many history items to save
    'historyLength': 1000,

    //  The prompt pattern
    'prompt': '%hostname%: %cwd% %username%$ ',

    //  Any commands to run on "login"
    'loginCommand': null,

    //  The user's current working directory
    'cwd': '~'
};
