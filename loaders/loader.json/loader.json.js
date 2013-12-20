/**
 * json contain the data of ajax response.
 */
/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, noarg:true, noempty:true, nonew:true, undef:true, strict:true, browser:true, nomen:false */
/*global w,jQuery*/
w.loader_add('json', {

  load: function (name, options) {
    "use strict";
    // We can use load_json with no name. In this case
    // options is never undefined due to extend_options,
    // but it can be empty.
    if (typeof name === 'object') {
      // Adjust options and complete callback.
      options = w.extend_options(options);
      options.data = name;
      name = 'json_anonymous';
      // Create loading process.
      this.loading_process_launch(this.type, name, options);
    } else {
      this.load_ajax(name, options);
    }
  },

  /**
   * Parse json content only,
   * like an AJAX package.
   */
  process: function (process, script) {
    "use strict";
    if (script.name === 'json_anonymous') {
      // Start process.
      var loading_queue_id = process.loading_queue_append();
      // Parse.
      if (script.hasOwnProperty('data')) {
        process.parse(script.data);
      }
      // Stop process.
      process.loading_queue_complete(loading_queue_id, [script.data]);
    } else {
      process.get_script_ajax(this.type, script.name);
    }
  },

  parse_json: function (name, value) {
    "use strict";
    w.collection(this.type, name, value);
  }
});
