'use strict';

crop.factory('cropArea', ['cropCanvas', function(CropCanvas) {
  var CropArea = function(ctx, events) {
    this._ctx=ctx;
    this._events=events;

    this._minSize=80;

    this._cropCanvas=new CropCanvas(ctx);

    this._image=new Image();
    this._x = 0;
    this._y = 0;
    this._size = 200;
    this._ratio = 1;
  };

  /* GETTERS/SETTERS */

  CropArea.prototype.getImage = function () {
    return this._image;
  };
  CropArea.prototype.setImage = function (image) {
    this._image = image;
  };

  CropArea.prototype.getX = function () {
    return this._x;
  };
  CropArea.prototype.setX = function (x) {
    this._x = x;
    this._dontDragOutside();
  };

  CropArea.prototype.getY = function () {
    return this._y;
  };
  CropArea.prototype.setY = function (y) {
    this._y = y;
    this._dontDragOutside();
  };

  CropArea.prototype.getSize = function () {
    return this._size;
  };
  CropArea.prototype.setSize = function (size) {
    this._size = Math.max(this._minSize, size);
    this._dontDragOutside();
  };

  CropArea.prototype.getRatio = function () {
    return this._ratio;
  };
  CropArea.prototype.setRatio = function (ratio) {
    this._ratio = ratio
    this._dontDragOutside();
  };

  CropArea.prototype.getMinSize = function () {
    return this._minSize;
  };
  CropArea.prototype.setMinSize = function (size) {
    this._minSize = size;
    this._size = Math.max(this._minSize, this._size);
    this._dontDragOutside();
  };

  CropArea.prototype._dontResizeOutside = function() {
    var h = this._ctx.canvas.height;
    var w = this._ctx.canvas.width;

    var posX = this._x - (this._size / 2);
    var posY = this._y - ((this._size * this._ratio) / 2);

    if(this._size > w - posX) {
      this._size = w - posX;
    }
    if((this._size * this._ratio) > (h - posY)) {
      this._size = (h - posY) / this._ratio;
    }
  }

  /* FUNCTIONS */
  CropArea.prototype._dontDragOutside=function() {
    var h = this._ctx.canvas.height;
    var w = this._ctx.canvas.width;


    // var sizeY = this._size * this._ratio;
    var hSize = this._size / 2;
    var hSizeY = (this._size * this._ratio) / 2;

    if(this._x < hSize) {
      this._x = hSize;
    }
    if(this._x > w - hSize) {
      this._x = w - hSize;
    }

    if(this._y < hSizeY) {
      this._y = hSizeY;
    }
    if(this._y > h - hSizeY) {
      this._y = h - hSizeY;
    }
  };

  CropArea.prototype._drawArea=function() {};

  CropArea.prototype.draw=function() {
    // draw crop area
    this._cropCanvas.drawCropArea(this._image,[this._x,this._y],this._size,this._ratio,this._drawArea);
  };

  CropArea.prototype.processMouseMove=function() {};

  CropArea.prototype.processMouseDown=function() {};

  CropArea.prototype.processMouseUp=function() {};

  return CropArea;
}]);
