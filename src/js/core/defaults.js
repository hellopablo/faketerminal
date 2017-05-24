/**
 * The default options
 * @type {Object}
 */
window.FakeTerminal.defaultOptions = {

    //  The user's username
    'username': 'root',

    //  The hostname
    'hostname': window.location.host,

    //  How many history items to save
    'history': 1000,

    //  The prompt pattern
    'prompt': '[%username%@%hostname%: %cwd%] ',

    //  Any commands to run on "login"
    'login': null,

    //  The user's current working directory
    'cwd': '~'
};
