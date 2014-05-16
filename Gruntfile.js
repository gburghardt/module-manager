module.exports = function(grunt) {
  var files = grunt.file.readJSON('build/files.json'),
      config = {
        pkg: grunt.file.readJSON('package.json'),
        concat: {
          options: {
            banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
          }
        },
        min: {}
      },
      all = [];

  for (var key in files) {
    all.push("dist/<%= pkg.name %>-" + key + ".concat.js");

    config.concat[key] = {
      src: files[key],
      dest: "dist/<%= pkg.name %>-" + key + ".concat.js"
    };
    config.min[key] = {
      src: "dist/<%= pkg.name %>-" + key + ".concat.js",
      dest: "dist/<%= pkg.name %>-" + key + ".min.js"
    }
  }

  config.concat.all = {
    src: all,
    dest: "dist/<%= pkg.name %>.concat.js"
  };
  config.min.all = {
    src: "dist/<%= pkg.name %>.concat.js",
    dest: "dist/<%= pkg.name %>.min.js"
  };

  grunt.initConfig(config);
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-yui-compressor');
  grunt.registerTask('default', ['concat', 'min']);
};