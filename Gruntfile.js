module.exports = function (grunt) {
    require('jit-grunt')(grunt);

    grunt.initConfig({
        less:   {
            development: {
                options: {
                    compress:     true,
                    yuicompress:  true,
                    optimization: 2
                },
                files:   {
                    'dist/faketerminal.css': 'src/less/faketerminal.less' // destination file and source file
                }
            }
        },
        uglify: {
            compressed:   {
                files:   {
                    'dist/faketerminal.min.js': [
                        'src/js/core/namespace.js',
                        'src/js/core/defaults.js',
                        'src/js/core/main.js',
                        'src/js/core/output.js',
                        'src/js/core/input.js',
                        'src/js/core/filesystem.js',
                        'src/js/core/history.js',
                        'src/js/core/command.base.js',
                        'src/js/commands/*.js',
                        'src/js/core/jquery.js'
                    ]
                },
                options: {
                    sourceMap:     true,
                    sourceMapName: 'dist/faketerminal.min.js.map'
                }
            },
            uncompressed: {
                files:   {
                    'dist/faketerminal.js': [
                        'src/js/core/namespace.js',
                        'src/js/core/defaults.js',
                        'src/js/core/main.js',
                        'src/js/core/output.js',
                        'src/js/core/input.js',
                        'src/js/core/filesystem.js',
                        'src/js/core/history.js',
                        'src/js/core/command.base.js',
                        'src/js/commands/*.js',
                        'src/js/core/jquery.js'
                    ]
                },
                options: {
                    mangle:           false,
                    compress:         false,
                    beautify:         true,
                    preserveComments: true,
                    sourceMap:        true,
                    sourceMapName:    'dist/faketerminal.js.map'
                }
            }
        },
        watch:  {
            less:   {
                files:   ['src/less/**/*.less'],
                tasks:   ['less'],
                options: {
                    nospawn: true
                }
            },
            uglify: {
                files:   [
                    'src/js/**/*.js'
                ],
                tasks:   [
                    'uglify:compressed',
                    'uglify:uncompressed'
                ],
                options: {
                    nospawn: true
                }
            }
        }
    });

    grunt.registerTask('build', ['less', 'uglify:compressed', 'uglify:uncompressed']);
    grunt.registerTask('default', ['build', 'watch']);
};
