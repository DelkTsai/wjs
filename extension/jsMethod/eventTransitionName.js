(function (loader) {
  'use strict';
  /**
   * Returns name of css transition event,
   * used to detect when a CSS animation ends.
   */
  loader.methodAdd('eventTransitionName', function (name, proto) {
    var t,
      fakeElement = this.window.document.createElement('fakeElement'),
      transitions = {
        'WebkitTransition': 'webkitAnimationEnd',
        'OTransition': 'oAnimationEnd',
        'MozTransition': 'animationend',
        'transition': 'animationend'
      };

    for (t in transitions) {
      if (transitions.hasOwnProperty(t) && fakeElement.style[t] !== undefined) {
        return transitions[t];
      }
    }
  });
}(loader));