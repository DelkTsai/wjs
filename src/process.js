/**
 * Loading process.
 * Wjs allow to load multiple loading processes.
 * Each process can load a script or a collection of different scripts
 * and can execute a "complete" callback when finished.
 * This is useful when loading is asynchronous and allows
 * to launch several processes separately.
 * @param {WjsProto} wjs
 */
(function (context) {
  'use strict';
  // <--]
  /**
   * We don't use classExtend, given that
   * processes does not use class inheritances.
   * @param {Object=} options
   * @constructor
   */
  var WJSProcessProto = function (options) {
    options = options || {};
    // Default values
    context.wjs.extendObject(this, {
      /** @type {WJSProto} */
      wjs: context.wjs,
      /** @type {Object.Object} */
      parseQ: {},
      /** @type {boolean} Async mode is specified for whole process. */
      async: options.async || false,
      /** @type {Function} */
      completeCallbacks: options.complete,
      /** @type {boolean} */
      loadingStarted: false,
      /** @type {Array.Object} */
      extRequests: [],
      exclude: options.exclude,
      // Save which extension we should return at the end
      // of the process, even several content is returned into
      // the response package.
      /** @type {string} */
      mainType: options.mainType,
      /** @type {string} */
      mainName: options.mainName
    });
    // Save it into w.
    this.wjs.processes.push(this);
  };

  WJSProcessProto.prototype = {

    /**
     * Add a request to the process, all requests will
     * be launched in one time.
     * @param {Object} requestData
     */
    extRequestAdd: function (requestData) {
      var self = this;
      // Prevent to add request after starting retrieving.
      if (self.loadingStarted === false) {
        self.extRequests.push(requestData);
      }
      else {
        self.wjs.err('Try to add extensions request after process start.');
      }
    },

    /**
     * Launch retrieving.
     */
    loadingStart: function () {
      var i, key,
        self = this,
        requests = self.extRequests,
        request,
        settings = self.wjs.settings,
        serverRequest = {},
        responsePackage = {};
      self.loadingStarted = true;
      // Treat requests list.
      for (i = 0; i < self.extRequests.length; i++) {
        request = requests[i];
        switch (request.mode) {
          case 'server':
            // Build query for server.
            key = settings.paramInc + '[' + request.type + ']';
            serverRequest[key] = serverRequest[key] ? serverRequest[key] + ',' + request.name : request.name;
            break;
          case 'parse':
            if (responsePackage[request.type] === undefined) {
              responsePackage[request.type] = {};
            }
            responsePackage[request.type][request.name] =
            {'#data': request.data};
            break;
        }
      }
      // Do we need a server request.
      if (!self.wjs.objectIsEmpty(serverRequest)) {
        // Create exclusion vars.
        // Exclusions are considered as global
        // for the hole request.
        if (self.exclude) {
          if (self.exclude === true) {
            serverRequest[settings.paramExc] = '1';
          }
          else {
            key = Object.keys(self.exclude);
            for (i = 0; i < key.length; i++) {
              serverRequest[settings.paramExc + '[' + key[i] + ']'] = self.exclude[key[i]].join(',');
            }
          }
        }
        // Launch AJAX call.
        self.wjs.ajax({
          url: settings.responsePath + '?' +
            self.wjs.param(serverRequest) +
            settings.paramExtra,
          method: 'GET',
          async: self.async,
          success: function (data) {
            // Add retrieved data to response package.
            self.wjs.extendObject(responsePackage,
              JSON.parse(data.responseText));
            // We parse response as json in all cases.
            self.responseParse(responsePackage);
          }
        });
      }
      else {
        self.responseParse(responsePackage);
      }
    },

    /**
     * Callback when all request complete,
     * only one complete callback after start.
     *
     * @param silent Set to true avoid callbacks calls.
     */
    loadingComplete: function (silent) {
      var self = this, arg;
      // Remove this element from processes.
      self.wjs.processes.splice(self.wjs.processes.indexOf(self), 1);
      // Execute complete callback.
      if (!silent && self.completeCallbacks) {
        self.wjs.callbacks([self.completeCallbacks], [self.wjs.extGet(self.mainType, self.mainName)]);
      }
      // Protect against modification, object
      // should be eligible for garbage collection.
      Object.freeze(self);
    },

    /**
     * Parse response package.
     * Response is stored as a json object : {
     *   "requestedExtensionType":{
     *     "requestedExtensionName":{
     *       "#require":{
     *          "requiredExtensionType":[
     *            "requiredExtensionName1",
     *            "requiredExtensionName2"
     *          ]
     *       },
     *       "#data":"returnedExtensionData"
     *     }
     *   }
     * }
     */
    responseParse: function (response) {
      var self = this;
      // Add data to parse queue.
      self.wjs.extendObject(self.parseQ, response);
      // Launch first item parsing.
      self.responseParseNext();
    },

    /**
     * Launch parsing of next item in the parse queue.
     */
    responseParseNext: function () {
      var self = this,
        queue = self.parseQ,
        queueKeys = Object.keys(queue),
        queueItemsKeys;
      // Take first item.
      // Type must also exists in registered loaders.
      if (queueKeys[0] && self.wjs.loaders[queueKeys[0]]) {
        queueItemsKeys = Object.keys(queue[queueKeys[0]]);
        if (queueItemsKeys[0]) {
          self.responseParseItem(queueKeys[0], queueItemsKeys[0]);
          // We stop to the first matched item.
          // Next treatment should be launched by parsing function.
          // It allows to treat asynchronous parsing, like files.
          return;
        }
      }
      // At the end of loading, queue must be empty.
      // If not, may be an unknown script is present in
      // the returned package.
      if (queueKeys.length > 0) {
        self.wjs.err('Parse queue not empty.');
      }
      self.loadingComplete();
    },

    /**
     * Create a specific function allows to parse item from
     * external context, like in requirement treatment.
     * @param {string} extensionType
     * @param {string} extensionName
     */
    responseParseItem: function (extensionType, extensionName, callback) {
      var self = this, queueItem = self.parseQ[extensionType][extensionName];
      // parseQ contains a editable object, we use it to store
      // callbacks, they will wait for parse complete event requirements exists.
      // These callbacks are different from request callbacks,
      // they are executed at the end of parsing only and are
      // used internally to manage requests queues an dependencies.
      if (callback) {
        queueItem['#callbacks'] = queueItem['#callbacks'] || [];
        queueItem['#callbacks'].push(callback);
      }
      // Parse using according loader.
      self.wjs.loaders[extensionType]
        .responseParseItem(
          extensionName,
          queueItem,
          self);
    },

    /**
     * @param {string} extensionType
     * @param {string} extensionName
     * @param {?} saveData
     */
    parseItemComplete: function (extensionType, extensionName, saveData) {
      var self = this, queueItem = self.parseQ[extensionType];
      // Save.
      self.wjs.extLoaded[extensionType][extensionName] = saveData;
      if (queueItem[extensionName]['#callbacks']) {
        self.wjs.callbacks(queueItem[extensionName]['#callbacks']);
      }
      // Remove from queue.
      delete queueItem[extensionName];
      if (self.wjs.objectIsEmpty(self.parseQ[extensionType])) {
        delete self.parseQ[extensionType];
      }
      self.responseParseNext();
    }
  };
  // We save reference to prototype into wjs.
  context.wjs.processProto = WJSProcessProto;
  // [-->
}(window));
