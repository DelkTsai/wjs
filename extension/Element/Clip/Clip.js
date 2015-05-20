/**
 * Clips have a specific centered positioning system.
 * @require Element > Sprite
 */
(function (WjsProto) {
  'use strict';
  WjsProto.register('Element','Clip', {
    classExtends: 'BasicElement\\Sprite',
    variables: {
      top: 0,
      left: 0
    },

    options: {
      width: 320,
      height: 240
    },

    optionsDefault: {
      html: '',
      top: 0,
      left: 0
    },

    positionAdjust: function (positionData, relativeToBinder) {
      // Clip must have a parent to be repositioned.
      if (this.parent) {
        var relativeRect,
          rect = this.parent.dom.getBoundingClientRect(),
          output = {
            top: positionData.top + (rect.height - positionData.height) / 2,
            left: positionData.left + (rect.width - positionData.width) / 2,
            width: positionData.width,
            height: positionData.height
          };
        // Adjust according given binder.
        if (relativeToBinder) {
          relativeRect = relativeToBinder.dom.getBoundingClientRect();
          output.top += relativeRect.top;
          output.left += relativeRect.left;
        }
        return output;
      }
      return positionData;
    },

    renderReset: function () {
      // We not extend base who is an empty object.
      return {
        top: this.top,
        left: this.left,
        width: this.width,
        height: this.height
      };
    },

    renderDom: function (renderData) {
      if (this.dom) {
        renderData = this.positionAdjust(renderData);
        var i = 0, properties = ['top', 'left', 'width', 'height'];
        for (; i < properties.length; i++) {
          this.dom.style[properties[i]] = renderData[properties[i]] + 'px';
        }
      }
    },

    bundle: {
      Null: {
        classExtends: 'BasicElement\\Clip'
      }
    }
  });
}(WjsProto));
