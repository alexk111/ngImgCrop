'use strict';

crop.factory('cropArea', ['cropCanvas', function(CropCanvas) {
  var CropArea = function(ctx, events) {
    this._ctx=ctx;
    this._events=events;

    this._minSize = 80;
    // since minSize is scaled, we need to set another minimum regardless of scale
    this._unscaledMinSize = 40;

    this._cropCanvas=new CropCanvas(ctx);

    this._image=new Image();
    this._x = 0;
    this._y = 0;
    this._width = 200;
    this._aspect = [1,1];
    this._height = Math.floor(this._aspect[1] * this._width / this._aspect[0]);
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
    return this._width;
  };
  CropArea.prototype.setSize = function (size) {
    // scale is the ratio of image to canvas size
    var scale = this.getScale();
    var minSizeScale = Math.round(scale*this._minSize);
    
    this._width = Math.max(minSizeScale, this._unscaledMinSize, size);
    this._height = Math.floor(this._aspect[1] * this._width / this._aspect[0]);    
    this._dontDragOutside();
  };
  CropArea.prototype.getWidth = function () {
    return this._width;
  };
  CropArea.prototype.setWidth = function (width) {
    this.setSize(width);
  };
  CropArea.prototype.getHeight = function () {
    return this._height;
  };
  CropArea.prototype.setHeight = function (height) {
    // determine minHeight based on minWidth and aspect ratio
    var minHeight = Math.floor(this._aspect[1] * this._minSize / this._aspect[0]);
    // height is no smaller than minHeight
    var newHeight = Math.max(minHeight, height);
    // get conversion of width based on newheight and aspect ratio
    var newWidth = Math.floor(this._aspect[0] * newHeight / this._aspect[1]);
    this.setSize(newWidth);
  };

  CropArea.prototype.getMinSize = function () {
    return this._minSize;
  };
  CropArea.prototype.setMinSize = function (size) {
    this._minSize = size;
    this._width = Math.max(this._minSize, this._width);
    this._height = Math.floor(this._aspect[1] * this._width / this._aspect[0]);
    this._dontDragOutside();
  };

  CropArea.prototype.getAspect = function () {
    return this._aspect;
  };
  CropArea.prototype.setAspect = function (w, h) {
    this._aspect = [w,h];
    this._dontDragOutside();
  };
  CropArea.prototype.getScale = function () {
    var xScale = this._ctx.canvas.width/this._image.width;
    var yScale = this._ctx.canvas.height/this._image.height;

    // only return real float values
    if(isNaN(xScale) || isNaN(yScale) || !isFinite(xScale) || !isFinite(yScale)){
      xScale = 1;
      yScale = 1;
    }

    return Math.max(xScale, yScale);
  };

  /* FUNCTIONS */
  CropArea.prototype._dontDragOutside=function() {
    var h=this._ctx.canvas.height,
        w=this._ctx.canvas.width;
    if(this._width>w) { 
      this._width=w; 
    }
    if(this._height>h) { this._height=h; }
    if(this._x<this._width/2) { this._x=this._width/2; }
    if(this._x>w-this._width/2) { this._x=w-this._width/2; }
    if(this._y<this._height/2) { this._y=this._height/2; }
    if(this._y>h-this._height/2) { this._y=h-this._height/2; }
  };

  CropArea.prototype._drawArea=function() {};

  CropArea.prototype.draw=function() {
    // draw crop area
    this._cropCanvas.drawCropArea(this._image,[this._x,this._y],this._width,this._height,this._drawArea);
  };

  CropArea.prototype.processMouseMove=function() {};

  CropArea.prototype.processMouseDown=function() {};

  CropArea.prototype.processMouseUp=function() {};

  return CropArea;
}]);