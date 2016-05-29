/**
 * - Every sprite must be attached to a stage.
 */
(function (W) {
  'use strict';
  W.register('Element', 'Stage', {
    options: {
      playPlayer: true,
      autoPlay: true,
      fullScreen: {
        defaults: true,
        define: function (com, value) {
          if (value) {
            com.domListen(com.w.window, 'resize', 'windowResize');
          }
        },
        destroy: function (com) {
          // Remove event listener.
          if (com.fullScreen) {
            com.domForget(com.w.window, 'resize', 'windowResize');
          }
        }
      },
      dom: {
        define: function (com, value, options) {
          // Ensure to have body as default value.
          value = value || com.w.document.body;
          // Call base function.
          return this.__super('define', [com, value, options]);
        },
        destroy: function (com) {
          // Do not destroy body.
          if (com.dom !== com.w.document.body) {
            return this.__super('destroy', arguments);
          }
        }
      }
    },

    optionsDefault: {
      // Use dom.
      dom: true,
      // Use body as default destination.
      domDestination: W.context.window.document.body,
      // Use as animation player.
      playPlayer: true,
      // Launch play once created.
      autoPlay: true
    },

    initElement: function () {
      this.refreshSize();
    },

    refreshSize: function () {
      this.dom.style.width = this.w.window.innerWidth + 'px';
      this.dom.style.height = this.w.window.innerHeight + 'px';
    },

    callbacks: {
      domListen: {
        windowResize: function () {
          this.refreshSize();
          this.frameNextEnable();
        }
      }
    }
  });
}(W));
