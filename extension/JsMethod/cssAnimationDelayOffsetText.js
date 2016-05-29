(function (W) {
  'use strict';
  var letterAnimationCallback = function (domElement, w) {
    var domLetter = domElement.getElementsByClassName('letter')[0];
    // Wait for item animation end.
    w.cssAnimateCallback(domLetter, function () {
      // Insert "text" letter before node.
      domElement.insertAdjacentHTML('beforebegin', domLetter.innerHTML !== '&nbsp;' ? domLetter.innerHTML : ' ');
      // Remove node.
      domElement.parentNode.removeChild(domElement);
    });
  };
  /**
   * @require JsMethod > domTextWrapLetter
   * @require JsMethod > cssAnimationDelayOffset
   */
  W.register('JsMethod', 'cssAnimationDelayOffsetText', function (dom, timeOffset, timeGlobalDelay, timeOffsetMultiplier, reverse, destroyDom) {
    var
    // Add a span around each text letter.
      letters = this.domTextWrapLetter(dom);
    // Animate each span with a delay.
    this.cssAnimationDelayOffset(letters, null, timeOffset, timeGlobalDelay, timeOffsetMultiplier, false, reverse);
    // Undefined or true.
    if (destroyDom !== false) {
      for (var i = 0, item; item = dom.children[i++];) {
        letterAnimationCallback(item, this);
      }
    }
  });
}(W));
