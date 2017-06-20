/*!
 * ngImgCrop v0.3.2
 * https://github.com/alexk111/ngImgCrop
 *
 * Copyright (c) 2015 Alex Kaul
 * License: MIT
 *
 * Generated at Friday, February 27th, 2015, 12:44:49 PM
 */
(function() {
'use strict';

var crop = angular.module('ngImgCrop', []);

crop.factory('cropAreaCircle', ['cropArea', function(CropArea) {
  var CropAreaCircle = function() {
    CropArea.apply(this, arguments);

    this._boxResizeBaseSize = 20;
    this._boxResizeNormalRatio = 0.9;
    this._boxResizeHoverRatio = 1.2;
    this._iconMoveNormalRatio = 0.9;
    this._iconMoveHoverRatio = 1.2;

    this._boxResizeNormalSize = this._boxResizeBaseSize*this._boxResizeNormalRatio;
    this._boxResizeHoverSize = this._boxResizeBaseSize*this._boxResizeHoverRatio;

    this._posDragStartX=0;
    this._posDragStartY=0;
    this._posResizeStartX=0;
    this._posResizeStartY=0;
    this._posResizeStartSize=0;

    this._boxResizeIsHover = false;
    this._areaIsHover = false;
    this._boxResizeIsDragging = false;
    this._areaIsDragging = false;
  };

  CropAreaCircle.prototype = new CropArea();

  CropAreaCircle.prototype._calcCirclePerimeterCoords=function(angleDegrees) {
    var hSize=this._width/2;
    // circle code didn't account for vSize (both were always same before)
    var vSize= Math.floor(this._aspect[1] * (this._width/2) / this._aspect[0]);
    var angleRadians=angleDegrees * (Math.PI / 180),
        circlePerimeterX=this._x + hSize * Math.cos(angleRadians),
        circlePerimeterY=this._y + vSize * Math.sin(angleRadians);
    return [circlePerimeterX, circlePerimeterY];
  };

  CropAreaCircle.prototype._calcResizeIconCenterCoords=function() {
    return this._calcCirclePerimeterCoords(-45);
  };

  CropAreaCircle.prototype._isCoordWithinArea=function(coord) {
    return Math.sqrt((coord[0]-this._x)*(coord[0]-this._x) + (coord[1]-this._y)*(coord[1]-this._y)) < this._width/2;
  };
  CropAreaCircle.prototype._isCoordWithinBoxResize=function(coord) {
    var resizeIconCenterCoords=this._calcResizeIconCenterCoords();
    var hSize=this._boxResizeHoverSize/2;
    return(coord[0] > resizeIconCenterCoords[0] - hSize && coord[0] < resizeIconCenterCoords[0] + hSize &&
           coord[1] > resizeIconCenterCoords[1] - hSize && coord[1] < resizeIconCenterCoords[1] + hSize);
  };

  CropAreaCircle.prototype._drawArea= function(ctx,centerCoords,w,h){
    // old method, drawing circle...
    // ctx.arc(centerCoords[0],centerCoords[1],size/2,0,2*Math.PI);

    // new method, drawing ellipse using bezier curves
    var x = centerCoords[0] - w/2.0,
        y = centerCoords[1] - h/2.0;
    var kappa = 0.5522848,
        ox = (w / 2) * kappa, // control point offset horizontal
        oy = (h / 2) * kappa, // control point offset vertical
        xe = x + w,           // x-end
        ye = y + h,           // y-end
        xm = x + w / 2,       // x-middle
        ym = y + h / 2;       // y-middle

    ctx.beginPath();
    ctx.moveTo(x, ym);
    ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
    ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
    ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
    ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
    //ctx.closePath(); // not used correctly, see comments (use to close off open path)
    ctx.stroke();
  };

  CropAreaCircle.prototype.draw=function() {
    CropArea.prototype.draw.apply(this, arguments);

    // draw move icon
    this._cropCanvas.drawIconMove([this._x,this._y], this._areaIsHover?this._iconMoveHoverRatio:this._iconMoveNormalRatio);

    // draw resize cubes
    this._cropCanvas.drawIconResizeBoxNESW(this._calcResizeIconCenterCoords(), this._boxResizeBaseSize, this._boxResizeIsHover?this._boxResizeHoverRatio:this._boxResizeNormalRatio);
  };

  CropAreaCircle.prototype.processMouseMove=function(mouseCurX, mouseCurY) {
    var cursor='default';
    var res=false;
    var canvas_h=this._ctx.canvas.height,
        canvas_w=this._ctx.canvas.width;

    this._boxResizeIsHover = false;
    this._areaIsHover = false;

    if (this._areaIsDragging) {
      this._x = mouseCurX - this._posDragStartX;
      this._y = mouseCurY - this._posDragStartY;
      this._areaIsHover = true;
      cursor='move';
      res=true;
      this._events.trigger('area-move');
    } else if (this._boxResizeIsDragging) {
      cursor = 'nesw-resize';
      // horizontal distance moved (xMulti adjusts for direction)
      var iFX = mouseCurX - this._posResizeStartX;
      // starting crop width + distance moved = new crop width
      var iFW = this._posResizeStartSize + iFX;

      var wasWidth=this._width;
      var wasHeight=this._height;
      var scale = this.getScale();
      // rounds up the minimum crop to keep from collapsing crop area below minimum
      var minSizeScale = Math.ceil(scale*this._minSize);
      
      var newWidth= Math.max(minSizeScale, this._unscaledMinSize, iFW);
      var newHeight= Math.floor(this._aspect[1] * newWidth / this._aspect[0]);
      if(newWidth <= canvas_w && newHeight <= canvas_h){
        this._width = newWidth;
        this._height = newHeight;
        var x_posModifier=(this._width-wasWidth)/2;
        var y_posModifier=(this._height-wasHeight)/2;
        this._x+=x_posModifier;
        this._y+=y_posModifier*-1;
        this._boxResizeIsHover = true;
        res=true;
        this._events.trigger('area-resize');
      }
    } else if (this._isCoordWithinBoxResize([mouseCurX,mouseCurY])) {
      cursor = 'nesw-resize';
      this._areaIsHover = false;
      this._boxResizeIsHover = true;
      res=true;
    } else if(this._isCoordWithinArea([mouseCurX,mouseCurY])) {
      cursor = 'move';
      this._areaIsHover = true;
      res=true;
    }

    this._dontDragOutside();
    angular.element(this._ctx.canvas).css({'cursor': cursor});

    return res;
  };

  CropAreaCircle.prototype.processMouseDown=function(mouseDownX, mouseDownY) {
    if (this._isCoordWithinBoxResize([mouseDownX,mouseDownY])) {
      this._areaIsDragging = false;
      this._areaIsHover = false;
      this._boxResizeIsDragging = true;
      this._boxResizeIsHover = true;
      this._posResizeStartX=mouseDownX;
      this._posResizeStartY=mouseDownY;
      this._posResizeStartSize = this._width;
      this._events.trigger('area-resize-start');
    } else if (this._isCoordWithinArea([mouseDownX,mouseDownY])) {
      this._areaIsDragging = true;
      this._areaIsHover = true;
      this._boxResizeIsDragging = false;
      this._boxResizeIsHover = false;
      this._posDragStartX = mouseDownX - this._x;
      this._posDragStartY = mouseDownY - this._y;
      this._events.trigger('area-move-start');
    }
  };

  CropAreaCircle.prototype.processMouseUp=function(/*mouseUpX, mouseUpY*/) {
    if(this._areaIsDragging) {
      this._areaIsDragging = false;
      this._events.trigger('area-move-end');
    }
    if(this._boxResizeIsDragging) {
      this._boxResizeIsDragging = false;
      this._events.trigger('area-resize-end');
    }
    this._areaIsHover = false;
    this._boxResizeIsHover = false;

    this._posDragStartX = 0;
    this._posDragStartY = 0;
  };

  return CropAreaCircle;
}]);



crop.factory('cropAreaSquare', ['cropArea', function(CropArea) {
  var CropAreaSquare = function() {
    CropArea.apply(this, arguments);

    this._resizeCtrlBaseRadius = 10;
    this._resizeCtrlNormalRatio = 0.75;
    this._resizeCtrlHoverRatio = 1;
    this._iconMoveNormalRatio = 0.9;
    this._iconMoveHoverRatio = 1.2;

    this._resizeCtrlNormalRadius = this._resizeCtrlBaseRadius*this._resizeCtrlNormalRatio;
    this._resizeCtrlHoverRadius = this._resizeCtrlBaseRadius*this._resizeCtrlHoverRatio;

    this._posDragStartX=0;
    this._posDragStartY=0;
    this._posResizeStartX=0;
    this._posResizeStartY=0;
    this._posResizeStartWidth=0;
    this._posResizeStartHeight=0;

    this._resizeCtrlIsHover = -1;
    this._areaIsHover = false;
    this._resizeCtrlIsDragging = -1;
    this._areaIsDragging = false;
  };

  CropAreaSquare.prototype = new CropArea();

  CropAreaSquare.prototype._calcSquareCorners=function() {
    var hSize=this._width/2;
    var vSize=this._height/2;
    return [
      [this._x-hSize, this._y-vSize],
      [this._x+hSize, this._y-vSize],
      [this._x-hSize, this._y+vSize],
      [this._x+hSize, this._y+vSize]
    ];
  };

  CropAreaSquare.prototype._calcSquareDimensions=function() {
    var hSize=this._width/2;
    var vSize=this._height/2;
    return {
      left: this._x-hSize,
      top: this._y-vSize,
      right: this._x+hSize,
      bottom: this._y+vSize
    };
  };

  CropAreaSquare.prototype._isCoordWithinArea=function(coord) {
    var squareDimensions=this._calcSquareDimensions();
    return (coord[0]>=squareDimensions.left&&coord[0]<=squareDimensions.right&&coord[1]>=squareDimensions.top&&coord[1]<=squareDimensions.bottom);
  };

  CropAreaSquare.prototype._isCoordWithinResizeCtrl=function(coord) {
    var resizeIconsCenterCoords=this._calcSquareCorners();
    var res=-1;
    for(var i=0,len=resizeIconsCenterCoords.length;i<len;i++) {
      var resizeIconCenterCoords=resizeIconsCenterCoords[i];
      if(coord[0] > resizeIconCenterCoords[0] - this._resizeCtrlHoverRadius && coord[0] < resizeIconCenterCoords[0] + this._resizeCtrlHoverRadius &&
         coord[1] > resizeIconCenterCoords[1] - this._resizeCtrlHoverRadius && coord[1] < resizeIconCenterCoords[1] + this._resizeCtrlHoverRadius) {
        res=i;
        break;
      }
    }
    return res;
  };

  CropAreaSquare.prototype._drawArea=function(ctx,centerCoords,width,height){
    var hSize=width/2;
    var vSize=height/2;
    ctx.rect(centerCoords[0]-hSize,centerCoords[1]-vSize,width,height);
  };

  CropAreaSquare.prototype.draw=function() {
    CropArea.prototype.draw.apply(this, arguments);

    // draw move icon
    this._cropCanvas.drawIconMove([this._x,this._y], this._areaIsHover?this._iconMoveHoverRatio:this._iconMoveNormalRatio);

    // draw resize cubes
    var resizeIconsCenterCoords=this._calcSquareCorners();
    for(var i=0,len=resizeIconsCenterCoords.length;i<len;i++) {
      var resizeIconCenterCoords=resizeIconsCenterCoords[i];
      this._cropCanvas.drawIconResizeCircle(resizeIconCenterCoords, this._resizeCtrlBaseRadius, this._resizeCtrlIsHover===i?this._resizeCtrlHoverRatio:this._resizeCtrlNormalRatio);
    }
  };

  CropAreaSquare.prototype.processMouseMove=function(mouseCurX, mouseCurY) {
    var cursor='default';
    var res=false;
    var canvas_h=this._ctx.canvas.height,
        canvas_w=this._ctx.canvas.width;

    this._resizeCtrlIsHover = -1;
    this._areaIsHover = false;

    if (this._areaIsDragging) {
      this._x = mouseCurX - this._posDragStartX;
      this._y = mouseCurY - this._posDragStartY;
      this._areaIsHover = true;
      cursor='move';
      res=true;
      this._events.trigger('area-move');
    } else if (this._resizeCtrlIsDragging>-1) {
      var xMulti, yMulti;
      switch(this._resizeCtrlIsDragging) {
        case 0: // Top Left
          xMulti=-1;
          yMulti=-1;
          cursor = 'nwse-resize';
          break;
        case 1: // Top Right
          xMulti=1;
          yMulti=-1;
          cursor = 'nesw-resize';
          break;
        case 2: // Bottom Left
          xMulti=-1;
          yMulti=1;
          cursor = 'nesw-resize';
          break;
        case 3: // Bottom Right
          xMulti=1;
          yMulti=1;
          cursor = 'nwse-resize';
          break;
      }
      // horizontal distance moved (xMulti adjusts for direction)
      var iFX = (mouseCurX - this._posResizeStartX)*xMulti;
      // starting crop width + distance moved = new crop width
      var iFW = this._posResizeStartWidth + iFX;

      var wasWidth=this._width;
      var wasHeight=this._height;
      var scale = this.getScale();
      // rounds up the minimum crop to keep from collapsing crop area below minimum
      var minSizeScale = Math.ceil(scale*this._minSize);
      
      var newWidth= Math.max(minSizeScale, this._unscaledMinSize, iFW);
      var newHeight= Math.floor(this._aspect[1] * newWidth / this._aspect[0]);
      if(newWidth <= canvas_w && newHeight <= canvas_h){
        this._width = newWidth;
        this._height = newHeight;
        var x_posModifier=(this._width-wasWidth)/2;
        var y_posModifier=(this._height-wasHeight)/2;
        this._x+=x_posModifier*xMulti;
        this._y+=y_posModifier*yMulti;
        this._resizeCtrlIsHover = this._resizeCtrlIsDragging;
        res=true;
        this._events.trigger('area-resize');
      }
    } else {
      var hoveredResizeBox=this._isCoordWithinResizeCtrl([mouseCurX,mouseCurY]);
      if (hoveredResizeBox>-1) {
        switch(hoveredResizeBox) {
          case 0:
            cursor = 'nwse-resize';
            break;
          case 1:
            cursor = 'nesw-resize';
            break;
          case 2:
            cursor = 'nesw-resize';
            break;
          case 3:
            cursor = 'nwse-resize';
            break;
        }
        this._areaIsHover = false;
        this._resizeCtrlIsHover = hoveredResizeBox;
        res=true;
      } else if(this._isCoordWithinArea([mouseCurX,mouseCurY])) {
        cursor = 'move';
        this._areaIsHover = true;
        res=true;
      }
    }

    this._dontDragOutside();
    angular.element(this._ctx.canvas).css({'cursor': cursor});

    return res;
  };

  CropAreaSquare.prototype.processMouseDown=function(mouseDownX, mouseDownY) {
    var isWithinResizeCtrl=this._isCoordWithinResizeCtrl([mouseDownX,mouseDownY]);
    if (isWithinResizeCtrl>-1) {
      this._areaIsDragging = false;
      this._areaIsHover = false;
      this._resizeCtrlIsDragging = isWithinResizeCtrl;
      this._resizeCtrlIsHover = isWithinResizeCtrl;
      this._posResizeStartX=mouseDownX;
      this._posResizeStartY=mouseDownY;
      this._posResizeStartWidth = this._width;
      this._posResizeStartHeight = this._height;
      this._events.trigger('area-resize-start');
    } else if (this._isCoordWithinArea([mouseDownX,mouseDownY])) {
      this._areaIsDragging = true;
      this._areaIsHover = true;
      this._resizeCtrlIsDragging = -1;
      this._resizeCtrlIsHover = -1;
      this._posDragStartX = mouseDownX - this._x;
      this._posDragStartY = mouseDownY - this._y;
      this._events.trigger('area-move-start');
    }
  };

  CropAreaSquare.prototype.processMouseUp=function(/*mouseUpX, mouseUpY*/) {
    if(this._areaIsDragging) {
      this._areaIsDragging = false;
      this._events.trigger('area-move-end');
    }
    if(this._resizeCtrlIsDragging>-1) {
      this._resizeCtrlIsDragging = -1;
      this._events.trigger('area-resize-end');
    }
    this._areaIsHover = false;
    this._resizeCtrlIsHover = -1;

    this._posDragStartX = 0;
    this._posDragStartY = 0;
  };

  return CropAreaSquare;
}]);

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

crop.factory('cropCanvas', [function() {
  // Shape = Array of [x,y]; [0, 0] - center
  var shapeArrowNW=[[-0.5,-2],[-3,-4.5],[-0.5,-7],[-7,-7],[-7,-0.5],[-4.5,-3],[-2,-0.5]];
  var shapeArrowNE=[[0.5,-2],[3,-4.5],[0.5,-7],[7,-7],[7,-0.5],[4.5,-3],[2,-0.5]];
  var shapeArrowSW=[[-0.5,2],[-3,4.5],[-0.5,7],[-7,7],[-7,0.5],[-4.5,3],[-2,0.5]];
  var shapeArrowSE=[[0.5,2],[3,4.5],[0.5,7],[7,7],[7,0.5],[4.5,3],[2,0.5]];
  var shapeArrowN=[[-1.5,-2.5],[-1.5,-6],[-5,-6],[0,-11],[5,-6],[1.5,-6],[1.5,-2.5]];
  var shapeArrowW=[[-2.5,-1.5],[-6,-1.5],[-6,-5],[-11,0],[-6,5],[-6,1.5],[-2.5,1.5]];
  var shapeArrowS=[[-1.5,2.5],[-1.5,6],[-5,6],[0,11],[5,6],[1.5,6],[1.5,2.5]];
  var shapeArrowE=[[2.5,-1.5],[6,-1.5],[6,-5],[11,0],[6,5],[6,1.5],[2.5,1.5]];

  // Colors
  var colors={
    areaOutline: '#fff',
    resizeBoxStroke: '#fff',
    resizeBoxFill: '#444',
    resizeBoxArrowFill: '#fff',
    resizeCircleStroke: '#fff',
    resizeCircleFill: '#444',
    moveIconFill: '#fff'
  };

  return function(ctx){

    /* Base functions */

    // Calculate Point
    var calcPoint=function(point,offset,scale) {
        return [scale*point[0]+offset[0], scale*point[1]+offset[1]];
    };

    // Draw Filled Polygon
    var drawFilledPolygon=function(shape,fillStyle,centerCoords,scale) {
        ctx.save();
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        var pc, pc0=calcPoint(shape[0],centerCoords,scale);
        ctx.moveTo(pc0[0],pc0[1]);

        for(var p in shape) {
            if (p > 0) {
                pc=calcPoint(shape[p],centerCoords,scale);
                ctx.lineTo(pc[0],pc[1]);
            }
        }

        ctx.lineTo(pc0[0],pc0[1]);
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    };

    /* Icons */

    this.drawIconMove=function(centerCoords, scale) {
      drawFilledPolygon(shapeArrowN, colors.moveIconFill, centerCoords, scale);
      drawFilledPolygon(shapeArrowW, colors.moveIconFill, centerCoords, scale);
      drawFilledPolygon(shapeArrowS, colors.moveIconFill, centerCoords, scale);
      drawFilledPolygon(shapeArrowE, colors.moveIconFill, centerCoords, scale);
    };

    this.drawIconResizeCircle=function(centerCoords, circleRadius, scale) {
      var scaledCircleRadius=circleRadius*scale;
      ctx.save();
      ctx.strokeStyle = colors.resizeCircleStroke;
      ctx.lineWidth = 2;
      ctx.fillStyle = colors.resizeCircleFill;
      ctx.beginPath();
      ctx.arc(centerCoords[0],centerCoords[1],scaledCircleRadius,0,2*Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.closePath();
      ctx.restore();
    };

    this.drawIconResizeBoxBase=function(centerCoords, boxSize, scale) {
      var scaledBoxSize=boxSize*scale;
      ctx.save();
      ctx.strokeStyle = colors.resizeBoxStroke;
      ctx.lineWidth = 2;
      ctx.fillStyle = colors.resizeBoxFill;
      ctx.fillRect(centerCoords[0] - scaledBoxSize/2, centerCoords[1] - scaledBoxSize/2, scaledBoxSize, scaledBoxSize);
      ctx.strokeRect(centerCoords[0] - scaledBoxSize/2, centerCoords[1] - scaledBoxSize/2, scaledBoxSize, scaledBoxSize);
      ctx.restore();
    };
    this.drawIconResizeBoxNESW=function(centerCoords, boxSize, scale) {
      this.drawIconResizeBoxBase(centerCoords, boxSize, scale);
      drawFilledPolygon(shapeArrowNE, colors.resizeBoxArrowFill, centerCoords, scale);
      drawFilledPolygon(shapeArrowSW, colors.resizeBoxArrowFill, centerCoords, scale);
    };
    this.drawIconResizeBoxNWSE=function(centerCoords, boxSize, scale) {
      this.drawIconResizeBoxBase(centerCoords, boxSize, scale);
      drawFilledPolygon(shapeArrowNW, colors.resizeBoxArrowFill, centerCoords, scale);
      drawFilledPolygon(shapeArrowSE, colors.resizeBoxArrowFill, centerCoords, scale);
    };

    /* Crop Area */

    this.drawCropArea=function(image, centerCoords, width, height, fnDrawClipPath) {
      var xRatio=image.width/ctx.canvas.width,
          yRatio=image.height/ctx.canvas.height,
          xLeft=centerCoords[0]-width/2,
          yTop=centerCoords[1]-height/2;

      // console.log(image.width+' x '+image.height+' vs '+ctx.canvas.width+' x '+ctx.canvas.height);
      ctx.save();
      ctx.strokeStyle = colors.areaOutline;
      ctx.lineWidth = 2;
      ctx.beginPath();
      fnDrawClipPath(ctx, centerCoords, width, height);
      ctx.stroke();
      ctx.clip();

      // prevent factoring beyond the original image dimensions
      while(width*xRatio > image.width){ width--; }
      while(height*yRatio > image.height){ height--; }

      // draw part of original image
      if (width > 0 && height > 0) {
          ctx.drawImage(image, xLeft*xRatio, yTop*yRatio, width*xRatio, height*yRatio, xLeft, yTop, width, height);
      }

      ctx.beginPath();
      fnDrawClipPath(ctx, centerCoords, width, height);
      ctx.stroke();
      ctx.clip();

      ctx.restore();
    };

  };
}]);

/**
 * EXIF service is based on the exif-js library (https://github.com/jseidelin/exif-js)
 */

crop.service('cropEXIF', [function() {
  var debug = false;

  var ExifTags = this.Tags = {

      // version tags
      0x9000 : 'ExifVersion',             // EXIF version
      0xA000 : 'FlashpixVersion',         // Flashpix format version

      // colorspace tags
      0xA001 : 'ColorSpace',              // Color space information tag

      // image configuration
      0xA002 : 'PixelXDimension',         // Valid width of meaningful image
      0xA003 : 'PixelYDimension',         // Valid height of meaningful image
      0x9101 : 'ComponentsConfiguration', // Information about channels
      0x9102 : 'CompressedBitsPerPixel',  // Compressed bits per pixel

      // user information
      0x927C : 'MakerNote',               // Any desired information written by the manufacturer
      0x9286 : 'UserComment',             // Comments by user

      // related file
      0xA004 : 'RelatedSoundFile',        // Name of related sound file

      // date and time
      0x9003 : 'DateTimeOriginal',        // Date and time when the original image was generated
      0x9004 : 'DateTimeDigitized',       // Date and time when the image was stored digitally
      0x9290 : 'SubsecTime',              // Fractions of seconds for DateTime
      0x9291 : 'SubsecTimeOriginal',      // Fractions of seconds for DateTimeOriginal
      0x9292 : 'SubsecTimeDigitized',     // Fractions of seconds for DateTimeDigitized

      // picture-taking conditions
      0x829A : 'ExposureTime',            // Exposure time (in seconds)
      0x829D : 'FNumber',                 // F number
      0x8822 : 'ExposureProgram',         // Exposure program
      0x8824 : 'SpectralSensitivity',     // Spectral sensitivity
      0x8827 : 'ISOSpeedRatings',         // ISO speed rating
      0x8828 : 'OECF',                    // Optoelectric conversion factor
      0x9201 : 'ShutterSpeedValue',       // Shutter speed
      0x9202 : 'ApertureValue',           // Lens aperture
      0x9203 : 'BrightnessValue',         // Value of brightness
      0x9204 : 'ExposureBias',            // Exposure bias
      0x9205 : 'MaxApertureValue',        // Smallest F number of lens
      0x9206 : 'SubjectDistance',         // Distance to subject in meters
      0x9207 : 'MeteringMode',            // Metering mode
      0x9208 : 'LightSource',             // Kind of light source
      0x9209 : 'Flash',                   // Flash status
      0x9214 : 'SubjectArea',             // Location and area of main subject
      0x920A : 'FocalLength',             // Focal length of the lens in mm
      0xA20B : 'FlashEnergy',             // Strobe energy in BCPS
      0xA20C : 'SpatialFrequencyResponse',    //
      0xA20E : 'FocalPlaneXResolution',   // Number of pixels in width direction per FocalPlaneResolutionUnit
      0xA20F : 'FocalPlaneYResolution',   // Number of pixels in height direction per FocalPlaneResolutionUnit
      0xA210 : 'FocalPlaneResolutionUnit',    // Unit for measuring FocalPlaneXResolution and FocalPlaneYResolution
      0xA214 : 'SubjectLocation',         // Location of subject in image
      0xA215 : 'ExposureIndex',           // Exposure index selected on camera
      0xA217 : 'SensingMethod',           // Image sensor type
      0xA300 : 'FileSource',              // Image source (3 === DSC)
      0xA301 : 'SceneType',               // Scene type (1 === directly photographed)
      0xA302 : 'CFAPattern',              // Color filter array geometric pattern
      0xA401 : 'CustomRendered',          // Special processing
      0xA402 : 'ExposureMode',            // Exposure mode
      0xA403 : 'WhiteBalance',            // 1 = auto white balance, 2 = manual
      0xA404 : 'DigitalZoomRation',       // Digital zoom ratio
      0xA405 : 'FocalLengthIn35mmFilm',   // Equivalent foacl length assuming 35mm film camera (in mm)
      0xA406 : 'SceneCaptureType',        // Type of scene
      0xA407 : 'GainControl',             // Degree of overall image gain adjustment
      0xA408 : 'Contrast',                // Direction of contrast processing applied by camera
      0xA409 : 'Saturation',              // Direction of saturation processing applied by camera
      0xA40A : 'Sharpness',               // Direction of sharpness processing applied by camera
      0xA40B : 'DeviceSettingDescription',    //
      0xA40C : 'SubjectDistanceRange',    // Distance to subject

      // other tags
      0xA005 : 'InteroperabilityIFDPointer',
      0xA420 : 'ImageUniqueID'            // Identifier assigned uniquely to each image
  };

  var TiffTags = this.TiffTags = {
      0x0100 : 'ImageWidth',
      0x0101 : 'ImageHeight',
      0x8769 : 'ExifIFDPointer',
      0x8825 : 'GPSInfoIFDPointer',
      0xA005 : 'InteroperabilityIFDPointer',
      0x0102 : 'BitsPerSample',
      0x0103 : 'Compression',
      0x0106 : 'PhotometricInterpretation',
      0x0112 : 'Orientation',
      0x0115 : 'SamplesPerPixel',
      0x011C : 'PlanarConfiguration',
      0x0212 : 'YCbCrSubSampling',
      0x0213 : 'YCbCrPositioning',
      0x011A : 'XResolution',
      0x011B : 'YResolution',
      0x0128 : 'ResolutionUnit',
      0x0111 : 'StripOffsets',
      0x0116 : 'RowsPerStrip',
      0x0117 : 'StripByteCounts',
      0x0201 : 'JPEGInterchangeFormat',
      0x0202 : 'JPEGInterchangeFormatLength',
      0x012D : 'TransferFunction',
      0x013E : 'WhitePoint',
      0x013F : 'PrimaryChromaticities',
      0x0211 : 'YCbCrCoefficients',
      0x0214 : 'ReferenceBlackWhite',
      0x0132 : 'DateTime',
      0x010E : 'ImageDescription',
      0x010F : 'Make',
      0x0110 : 'Model',
      0x0131 : 'Software',
      0x013B : 'Artist',
      0x8298 : 'Copyright'
  };

  var GPSTags = this.GPSTags = {
      0x0000 : 'GPSVersionID',
      0x0001 : 'GPSLatitudeRef',
      0x0002 : 'GPSLatitude',
      0x0003 : 'GPSLongitudeRef',
      0x0004 : 'GPSLongitude',
      0x0005 : 'GPSAltitudeRef',
      0x0006 : 'GPSAltitude',
      0x0007 : 'GPSTimeStamp',
      0x0008 : 'GPSSatellites',
      0x0009 : 'GPSStatus',
      0x000A : 'GPSMeasureMode',
      0x000B : 'GPSDOP',
      0x000C : 'GPSSpeedRef',
      0x000D : 'GPSSpeed',
      0x000E : 'GPSTrackRef',
      0x000F : 'GPSTrack',
      0x0010 : 'GPSImgDirectionRef',
      0x0011 : 'GPSImgDirection',
      0x0012 : 'GPSMapDatum',
      0x0013 : 'GPSDestLatitudeRef',
      0x0014 : 'GPSDestLatitude',
      0x0015 : 'GPSDestLongitudeRef',
      0x0016 : 'GPSDestLongitude',
      0x0017 : 'GPSDestBearingRef',
      0x0018 : 'GPSDestBearing',
      0x0019 : 'GPSDestDistanceRef',
      0x001A : 'GPSDestDistance',
      0x001B : 'GPSProcessingMethod',
      0x001C : 'GPSAreaInformation',
      0x001D : 'GPSDateStamp',
      0x001E : 'GPSDifferential'
  };

  var StringValues = this.StringValues = {
      ExposureProgram : {
          0 : 'Not defined',
          1 : 'Manual',
          2 : 'Normal program',
          3 : 'Aperture priority',
          4 : 'Shutter priority',
          5 : 'Creative program',
          6 : 'Action program',
          7 : 'Portrait mode',
          8 : 'Landscape mode'
      },
      MeteringMode : {
          0 : 'Unknown',
          1 : 'Average',
          2 : 'CenterWeightedAverage',
          3 : 'Spot',
          4 : 'MultiSpot',
          5 : 'Pattern',
          6 : 'Partial',
          255 : 'Other'
      },
      LightSource : {
          0 : 'Unknown',
          1 : 'Daylight',
          2 : 'Fluorescent',
          3 : 'Tungsten (incandescent light)',
          4 : 'Flash',
          9 : 'Fine weather',
          10 : 'Cloudy weather',
          11 : 'Shade',
          12 : 'Daylight fluorescent (D 5700 - 7100K)',
          13 : 'Day white fluorescent (N 4600 - 5400K)',
          14 : 'Cool white fluorescent (W 3900 - 4500K)',
          15 : 'White fluorescent (WW 3200 - 3700K)',
          17 : 'Standard light A',
          18 : 'Standard light B',
          19 : 'Standard light C',
          20 : 'D55',
          21 : 'D65',
          22 : 'D75',
          23 : 'D50',
          24 : 'ISO studio tungsten',
          255 : 'Other'
      },
      Flash : {
          0x0000 : 'Flash did not fire',
          0x0001 : 'Flash fired',
          0x0005 : 'Strobe return light not detected',
          0x0007 : 'Strobe return light detected',
          0x0009 : 'Flash fired, compulsory flash mode',
          0x000D : 'Flash fired, compulsory flash mode, return light not detected',
          0x000F : 'Flash fired, compulsory flash mode, return light detected',
          0x0010 : 'Flash did not fire, compulsory flash mode',
          0x0018 : 'Flash did not fire, auto mode',
          0x0019 : 'Flash fired, auto mode',
          0x001D : 'Flash fired, auto mode, return light not detected',
          0x001F : 'Flash fired, auto mode, return light detected',
          0x0020 : 'No flash function',
          0x0041 : 'Flash fired, red-eye reduction mode',
          0x0045 : 'Flash fired, red-eye reduction mode, return light not detected',
          0x0047 : 'Flash fired, red-eye reduction mode, return light detected',
          0x0049 : 'Flash fired, compulsory flash mode, red-eye reduction mode',
          0x004D : 'Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected',
          0x004F : 'Flash fired, compulsory flash mode, red-eye reduction mode, return light detected',
          0x0059 : 'Flash fired, auto mode, red-eye reduction mode',
          0x005D : 'Flash fired, auto mode, return light not detected, red-eye reduction mode',
          0x005F : 'Flash fired, auto mode, return light detected, red-eye reduction mode'
      },
      SensingMethod : {
          1 : 'Not defined',
          2 : 'One-chip color area sensor',
          3 : 'Two-chip color area sensor',
          4 : 'Three-chip color area sensor',
          5 : 'Color sequential area sensor',
          7 : 'Trilinear sensor',
          8 : 'Color sequential linear sensor'
      },
      SceneCaptureType : {
          0 : 'Standard',
          1 : 'Landscape',
          2 : 'Portrait',
          3 : 'Night scene'
      },
      SceneType : {
          1 : 'Directly photographed'
      },
      CustomRendered : {
          0 : 'Normal process',
          1 : 'Custom process'
      },
      WhiteBalance : {
          0 : 'Auto white balance',
          1 : 'Manual white balance'
      },
      GainControl : {
          0 : 'None',
          1 : 'Low gain up',
          2 : 'High gain up',
          3 : 'Low gain down',
          4 : 'High gain down'
      },
      Contrast : {
          0 : 'Normal',
          1 : 'Soft',
          2 : 'Hard'
      },
      Saturation : {
          0 : 'Normal',
          1 : 'Low saturation',
          2 : 'High saturation'
      },
      Sharpness : {
          0 : 'Normal',
          1 : 'Soft',
          2 : 'Hard'
      },
      SubjectDistanceRange : {
          0 : 'Unknown',
          1 : 'Macro',
          2 : 'Close view',
          3 : 'Distant view'
      },
      FileSource : {
          3 : 'DSC'
      },

      Components : {
          0 : '',
          1 : 'Y',
          2 : 'Cb',
          3 : 'Cr',
          4 : 'R',
          5 : 'G',
          6 : 'B'
      }
  };

  function addEvent(element, event, handler) {
      if (element.addEventListener) {
          element.addEventListener(event, handler, false);
      } else if (element.attachEvent) {
          element.attachEvent('on' + event, handler);
      }
  }

  function imageHasData(img) {
      return !!(img.exifdata);
  }

  function base64ToArrayBuffer(base64, contentType) {
      contentType = contentType || base64.match(/^data\:([^\;]+)\;base64,/mi)[1] || ''; // e.g. 'data:image/jpeg;base64,...' => 'image/jpeg'
      base64 = base64.replace(/^data\:([^\;]+)\;base64,/gmi, '');
      var binary = atob(base64);
      var len = binary.length;
      var buffer = new ArrayBuffer(len);
      var view = new Uint8Array(buffer);
      for (var i = 0; i < len; i++) {
          view[i] = binary.charCodeAt(i);
      }
      return buffer;
  }

  function objectURLToBlob(url, callback) {
      var http = new XMLHttpRequest();
      http.open('GET', url, true);
      http.responseType = 'blob';
      http.onload = function(e) {
          if (this.status === 200 || this.status === 0) {
              callback(this.response);
          }
      };
      http.send();
  }

  function getImageData(img, callback) {
      function handleBinaryFile(binFile) {
          var data = findEXIFinJPEG(binFile);
          var iptcdata = findIPTCinJPEG(binFile);
          img.exifdata = data || {};
          img.iptcdata = iptcdata || {};
          if (callback) {
              callback.call(img);
          }
      }

      if (img.src) {
          if (/^data\:/i.test(img.src)) { // Data URI
              var arrayBuffer = base64ToArrayBuffer(img.src);
              handleBinaryFile(arrayBuffer);

          } else if (/^blob\:/i.test(img.src)) { // Object URL
              var fileReader = new FileReader();
              fileReader.onload = function(e) {
                  handleBinaryFile(e.target.result);
              };
              objectURLToBlob(img.src, function (blob) {
                  fileReader.readAsArrayBuffer(blob);
              });
          } else {
              var http = new XMLHttpRequest();
              http.onload = function() {
                  if (this.status === 200 || this.status === 0) {
                      handleBinaryFile(http.response);
                  } else {
                      throw 'Could not load image';
                  }
                  http = null;
              };
              http.open('GET', img.src, true);
              http.responseType = 'arraybuffer';
              http.send(null);
          }
      } else if (window.FileReader && (img instanceof window.Blob || img instanceof window.File)) {
          var fileReader = new FileReader();
          fileReader.onload = function(e) {
              if (debug){ console.log('Got file of length ' + e.target.result.byteLength);}
              handleBinaryFile(e.target.result);
          };

          fileReader.readAsArrayBuffer(img);
      }
  }

  function findEXIFinJPEG(file) {
      var dataView = new DataView(file);

      if (debug){ console.log('Got file of length ' + file.byteLength);}
      if ((dataView.getUint8(0) !== 0xFF) || (dataView.getUint8(1) !== 0xD8)) {
          if (debug){ console.log('Not a valid JPEG');}
          return false; // not a valid jpeg
      }

      var offset = 2,
          length = file.byteLength,
          marker;

      while (offset < length) {
          if (dataView.getUint8(offset) !== 0xFF) {
              if (debug){ console.log('Not a valid marker at offset ' + offset + ', found: ' + dataView.getUint8(offset));}
              return false; // not a valid marker, something is wrong
          }

          marker = dataView.getUint8(offset + 1);
          if (debug){ console.log(marker);}

          // we could implement handling for other markers here,
          // but we're only looking for 0xFFE1 for EXIF data

          if (marker === 225) {
              if (debug){ console.log('Found 0xFFE1 marker');}

              return readEXIFData(dataView, offset + 4, dataView.getUint16(offset + 2) - 2);

              // offset += 2 + file.getShortAt(offset+2, true);

          } else {
              offset += 2 + dataView.getUint16(offset+2);
          }

      }

  }

  function findIPTCinJPEG(file) {
      var dataView = new DataView(file);

      if (debug){ console.log('Got file of length ' + file.byteLength);}
      if ((dataView.getUint8(0) !== 0xFF) || (dataView.getUint8(1) !== 0xD8)) {
          if (debug){ console.log('Not a valid JPEG');}
          return false; // not a valid jpeg
      }

      var offset = 2,
          length = file.byteLength;

      var isFieldSegmentStart = function(dataView, offset){
          return (
              dataView.getUint8(offset) === 0x38 &&
              dataView.getUint8(offset+1) === 0x42 &&
              dataView.getUint8(offset+2) === 0x49 &&
              dataView.getUint8(offset+3) === 0x4D &&
              dataView.getUint8(offset+4) === 0x04 &&
              dataView.getUint8(offset+5) === 0x04
          );
      };

      while (offset < length) {

          if ( isFieldSegmentStart(dataView, offset )){

              // Get the length of the name header (which is padded to an even number of bytes)
              var nameHeaderLength = dataView.getUint8(offset+7);
              if(nameHeaderLength % 2 !== 0){ nameHeaderLength += 1;}
              // Check for pre photoshop 6 format
              if(nameHeaderLength === 0) {
                  // Always 4
                  nameHeaderLength = 4;
              }

              var startOffset = offset + 8 + nameHeaderLength;
              var sectionLength = dataView.getUint16(offset + 6 + nameHeaderLength);

              return readIPTCData(file, startOffset, sectionLength);
          }

          // Not the marker, continue searching
          offset++;

      }

  }
  var IptcFieldMap = {
      0x78 : 'caption',
      0x6E : 'credit',
      0x19 : 'keywords',
      0x37 : 'dateCreated',
      0x50 : 'byline',
      0x55 : 'bylineTitle',
      0x7A : 'captionWriter',
      0x69 : 'headline',
      0x74 : 'copyright',
      0x0F : 'category'
  };
  function readIPTCData(file, startOffset, sectionLength){
      var dataView = new DataView(file);
      var data = {};
      var fieldValue, fieldName, dataSize, segmentType, segmentSize;
      var segmentStartPos = startOffset;
      while(segmentStartPos < startOffset+sectionLength) {
          if(dataView.getUint8(segmentStartPos) === 0x1C && dataView.getUint8(segmentStartPos+1) === 0x02){
              segmentType = dataView.getUint8(segmentStartPos+2);
              if(segmentType in IptcFieldMap) {
                  dataSize = dataView.getInt16(segmentStartPos+3);
                  segmentSize = dataSize + 5;
                  fieldName = IptcFieldMap[segmentType];
                  fieldValue = getStringFromDB(dataView, segmentStartPos+5, dataSize);
                  // Check if we already stored a value with this name
                  if(data.hasOwnProperty(fieldName)) {
                      // Value already stored with this name, create multivalue field
                      if(data[fieldName] instanceof Array) {
                          data[fieldName].push(fieldValue);
                      }
                      else {
                          data[fieldName] = [data[fieldName], fieldValue];
                      }
                  }
                  else {
                      data[fieldName] = fieldValue;
                  }
              }

          }
          segmentStartPos++;
      }
      return data;
  }

  function readTags(file, tiffStart, dirStart, strings, bigEnd) {
      var entries = file.getUint16(dirStart, !bigEnd),
          tags = {},
          entryOffset, tag,
          i;

      for (i=0;i<entries;i++) {
          entryOffset = dirStart + i*12 + 2;
          tag = strings[file.getUint16(entryOffset, !bigEnd)];
          if (!tag && debug){ console.log('Unknown tag: ' + file.getUint16(entryOffset, !bigEnd));}
          tags[tag] = readTagValue(file, entryOffset, tiffStart, dirStart, bigEnd);
      }
      return tags;
  }

  function readTagValue(file, entryOffset, tiffStart, dirStart, bigEnd) {
      var type = file.getUint16(entryOffset+2, !bigEnd),
          numValues = file.getUint32(entryOffset+4, !bigEnd),
          valueOffset = file.getUint32(entryOffset+8, !bigEnd) + tiffStart,
          offset,
          vals, val, n,
          numerator, denominator;

      switch (type) {
          case 1: // byte, 8-bit unsigned int
          case 7: // undefined, 8-bit byte, value depending on field
              if (numValues === 1) {
                  return file.getUint8(entryOffset + 8, !bigEnd);
              } else {
                  offset = numValues > 4 ? valueOffset : (entryOffset + 8);
                  vals = [];
                  for (n=0;n<numValues;n++) {
                      vals[n] = file.getUint8(offset + n);
                  }
                  return vals;
              }
              break;

          case 2: // ascii, 8-bit byte
              offset = numValues > 4 ? valueOffset : (entryOffset + 8);
              return getStringFromDB(file, offset, numValues-1);

          case 3: // short, 16 bit int
              if (numValues === 1) {
                  return file.getUint16(entryOffset + 8, !bigEnd);
              } else {
                  offset = numValues > 2 ? valueOffset : (entryOffset + 8);
                  vals = [];
                  for (n=0;n<numValues;n++) {
                      vals[n] = file.getUint16(offset + 2*n, !bigEnd);
                  }
                  return vals;
              }
              break;

          case 4: // long, 32 bit int
              if (numValues === 1) {
                  return file.getUint32(entryOffset + 8, !bigEnd);
              } else {
                  vals = [];
                  for (n=0;n<numValues;n++) {
                      vals[n] = file.getUint32(valueOffset + 4*n, !bigEnd);
                  }
                  return vals;
              }
              break;

          case 5:    // rational = two long values, first is numerator, second is denominator
              if (numValues === 1) {
                  numerator = file.getUint32(valueOffset, !bigEnd);
                  denominator = file.getUint32(valueOffset+4, !bigEnd);
                  val = new Number(numerator / denominator);
                  val.numerator = numerator;
                  val.denominator = denominator;
                  return val;
              } else {
                  vals = [];
                  for (n=0;n<numValues;n++) {
                      numerator = file.getUint32(valueOffset + 8*n, !bigEnd);
                      denominator = file.getUint32(valueOffset+4 + 8*n, !bigEnd);
                      vals[n] = new Number(numerator / denominator);
                      vals[n].numerator = numerator;
                      vals[n].denominator = denominator;
                  }
                  return vals;
              }
              break;

          case 9: // slong, 32 bit signed int
              if (numValues === 1) {
                  return file.getInt32(entryOffset + 8, !bigEnd);
              } else {
                  vals = [];
                  for (n=0;n<numValues;n++) {
                      vals[n] = file.getInt32(valueOffset + 4*n, !bigEnd);
                  }
                  return vals;
              }
              break;

          case 10: // signed rational, two slongs, first is numerator, second is denominator
              if (numValues === 1) {
                  return file.getInt32(valueOffset, !bigEnd) / file.getInt32(valueOffset+4, !bigEnd);
              } else {
                  vals = [];
                  for (n=0;n<numValues;n++) {
                      vals[n] = file.getInt32(valueOffset + 8*n, !bigEnd) / file.getInt32(valueOffset+4 + 8*n, !bigEnd);
                  }
                  return vals;
              }
      }
  }

  function getStringFromDB(buffer, start, length) {
      var outstr = '';
      for (var n = start; n < start+length; n++) {
          outstr += String.fromCharCode(buffer.getUint8(n));
      }
      return outstr;
  }

  function readEXIFData(file, start) {
      if (getStringFromDB(file, start, 4) !== 'Exif') {
          if (debug){ console.log('Not valid EXIF data! ' + getStringFromDB(file, start, 4));}
          return false;
      }

      var bigEnd,
          tags, tag,
          exifData, gpsData,
          tiffOffset = start + 6;

      // test for TIFF validity and endianness
      if (file.getUint16(tiffOffset) === 0x4949) {
          bigEnd = false;
      } else if (file.getUint16(tiffOffset) === 0x4D4D) {
          bigEnd = true;
      } else {
          if (debug){ console.log('Not valid TIFF data! (no 0x4949 or 0x4D4D)');}
          return false;
      }

      if (file.getUint16(tiffOffset+2, !bigEnd) !== 0x002A) {
          if (debug){ console.log('Not valid TIFF data! (no 0x002A)');}
          return false;
      }

      var firstIFDOffset = file.getUint32(tiffOffset+4, !bigEnd);

      if (firstIFDOffset < 0x00000008) {
          if (debug){ console.log('Not valid TIFF data! (First offset less than 8)', file.getUint32(tiffOffset+4, !bigEnd));}
          return false;
      }

      tags = readTags(file, tiffOffset, tiffOffset + firstIFDOffset, TiffTags, bigEnd);

      if (tags.ExifIFDPointer) {
          exifData = readTags(file, tiffOffset, tiffOffset + tags.ExifIFDPointer, ExifTags, bigEnd);
          for (tag in exifData) {
              switch (tag) {
                  case 'LightSource' :
                  case 'Flash' :
                  case 'MeteringMode' :
                  case 'ExposureProgram' :
                  case 'SensingMethod' :
                  case 'SceneCaptureType' :
                  case 'SceneType' :
                  case 'CustomRendered' :
                  case 'WhiteBalance' :
                  case 'GainControl' :
                  case 'Contrast' :
                  case 'Saturation' :
                  case 'Sharpness' :
                  case 'SubjectDistanceRange' :
                  case 'FileSource' :
                      exifData[tag] = StringValues[tag][exifData[tag]];
                      break;

                  case 'ExifVersion' :
                  case 'FlashpixVersion' :
                      exifData[tag] = String.fromCharCode(exifData[tag][0], exifData[tag][1], exifData[tag][2], exifData[tag][3]);
                      break;

                  case 'ComponentsConfiguration' :
                      exifData[tag] =
                          StringValues.Components[exifData[tag][0]] +
                          StringValues.Components[exifData[tag][1]] +
                          StringValues.Components[exifData[tag][2]] +
                          StringValues.Components[exifData[tag][3]];
                      break;
              }
              tags[tag] = exifData[tag];
          }
      }

      if (tags.GPSInfoIFDPointer) {
          gpsData = readTags(file, tiffOffset, tiffOffset + tags.GPSInfoIFDPointer, GPSTags, bigEnd);
          for (tag in gpsData) {
              switch (tag) {
                  case 'GPSVersionID' :
                      gpsData[tag] = gpsData[tag][0] +
                          '.' + gpsData[tag][1] +
                          '.' + gpsData[tag][2] +
                          '.' + gpsData[tag][3];
                      break;
              }
              tags[tag] = gpsData[tag];
          }
      }

      return tags;
  }

  this.getData = function(img, callback) {
      if ((img instanceof Image || img instanceof HTMLImageElement) && !img.complete){ return false;}

      if (!imageHasData(img)) {
          getImageData(img, callback);
      } else {
          if (callback) {
              callback.call(img);
          }
      }
      return true;
  };

  this.getTag = function(img, tag) {
      if (!imageHasData(img)){ return;}
      return img.exifdata[tag];
  };

  this.getAllTags = function(img) {
      if (!imageHasData(img)){ return {};}
      var a,
          data = img.exifdata,
          tags = {};
      for (a in data) {
          if (data.hasOwnProperty(a)) {
              tags[a] = data[a];
          }
      }
      return tags;
  };

  this.pretty = function(img) {
      if (!imageHasData(img)){ return '';}
      var a,
          data = img.exifdata,
          strPretty = '';
      for (a in data) {
          if (data.hasOwnProperty(a)) {
              if (typeof data[a] === 'object') {
                  if (data[a] instanceof Number) {
                      strPretty += a + ' : ' + data[a] + ' [' + data[a].numerator + '/' + data[a].denominator + ']\r\n';
                  } else {
                      strPretty += a + ' : [' + data[a].length + ' values]\r\n';
                  }
              } else {
                  strPretty += a + ' : ' + data[a] + '\r\n';
              }
          }
      }
      return strPretty;
  };

  this.readFromBinaryFile = function(file) {
      return findEXIFinJPEG(file);
  };
}]);

crop.factory('cropHost', ['$document', '$window', 'cropAreaCircle', 'cropAreaSquare', 'cropEXIF', function($document, $window, CropAreaCircle, CropAreaSquare, cropEXIF) {
  /* STATIC FUNCTIONS */

  // Get Element's Offset
  var getElementOffset=function(elem) {
      var box = elem.getBoundingClientRect();

      var body = $document[0].body;
      var docElem = $document[0].documentElement;

      var scrollTop = $window.pageYOffset || docElem.scrollTop || body.scrollTop;
      var scrollLeft = $window.pageXOffset || docElem.scrollLeft || body.scrollLeft;

      var clientTop = docElem.clientTop || body.clientTop || 0;
      var clientLeft = docElem.clientLeft || body.clientLeft || 0;

      var top  = box.top +  scrollTop - clientTop;
      var left = box.left + scrollLeft - clientLeft;

      return { top: Math.round(top), left: Math.round(left) };
  };

  return function(elCanvas, opts, events){
    /* PRIVATE VARIABLES */

    // Object Pointers
    var ctx=null,
        image=null,
        theArea=null;

    // Dimensions
    var minCanvasDims=[100,100],
        maxCanvasDims=[300,300];

    // Result Image size
    var resImgSize=200;

    // Result Image aspect ratio
    var resImgAspect= [1,1];

    var resImgWidth=resImgSize;

    var resImgHeight=Math.floor(resImgAspect[1] * resImgWidth / resImgAspect[0]);

    // Result Image type
    var resImgFormat='image/png';

    // Result Image quality
    var resImgQuality=null;

    /* PRIVATE FUNCTIONS */

    // Draw Scene
    function drawScene() {
      // clear canvas
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      if(image!==null) {
        // draw source image
        ctx.drawImage(image, 0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.save();

        // and make it darker
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.restore();

        // draw Area
        theArea.draw();
      }
    }

    // Resets CropHost
    var resetCropHost=function(toMax, cropData) {
      if(image!==null) {
        theArea.setImage(image);
        var imageDims=[image.width, image.height],
            imageRatio=image.width/image.height,
            canvasDims=imageDims,
            setX,
            setY,
            setSize,
            setHeight;

        if(canvasDims[0]>maxCanvasDims[0]) {
          canvasDims[0]=maxCanvasDims[0];
          canvasDims[1]=canvasDims[0]/imageRatio;
        } else if(canvasDims[0]<minCanvasDims[0]) {
          canvasDims[0]=minCanvasDims[0];
          canvasDims[1]=canvasDims[0]/imageRatio;
        }
        if(canvasDims[1]>maxCanvasDims[1]) {
          canvasDims[1]=maxCanvasDims[1];
          canvasDims[0]=canvasDims[1]*imageRatio;
        } else if(canvasDims[1]<minCanvasDims[1]) {
          canvasDims[1]=minCanvasDims[1];
          canvasDims[0]=canvasDims[1]*imageRatio;
        }
        elCanvas.prop('width',canvasDims[0]).prop('height',canvasDims[1]).css({'margin-left': -canvasDims[0]/2+'px', 'margin-top': -canvasDims[1]/2+'px'});

        setX = ctx.canvas.width/2;
        setY = ctx.canvas.height/2;

        if(toMax){
          // Set maximum cropping selection based on width
          setSize = ctx.canvas.width-1;
          setHeight = Math.floor(resImgAspect[1] * setSize / resImgAspect[0]);
        }else{
          // Set cropping selection to 3/4 width
          setSize = ctx.canvas.width*0.75;
          setHeight = Math.floor(resImgAspect[1] * setSize / resImgAspect[0]);
          if(setHeight > ctx.canvas.height * 0.75){
            // Set cropping selection to 3/4 height
            setHeight = ctx.canvas.height * 0.75;
            setSize = Math.floor(resImgAspect[0] * setHeight / resImgAspect[1]);
          }
        }
        
        if(typeof cropData !== 'undefined' && typeof cropData.width !== 'undefined' && cropData.width > 0){
          var cur_ratio = ctx.canvas.width/image.width;
          setSize = Math.round(cropData.width*cur_ratio);
          // Keep size in-bounds
          if(setSize > ctx.canvas.width) { setSize = ctx.canvas.width-1; }
          setHeight = Math.floor(resImgAspect[1] * setSize / resImgAspect[0]);
          // Passed cropData coordinates set to top left corner, adjusted in libarary at center point...
          setX = Math.round((cropData.x*cur_ratio)+(setSize/2));
          setY = Math.round((cropData.y*cur_ratio)+(setHeight/2));
        }
        // if width causes height to extend boundry
        if(setHeight > ctx.canvas.height){
          // Set maximum cropping selection based on height
          setHeight = ctx.canvas.height-1;
          setSize = Math.floor(resImgAspect[0] * setHeight / resImgAspect[1]);
        }
        // Keep coordinates in-bounds
        if(setX + (setSize/2) > ctx.canvas.width) { setX = Math.floor(ctx.canvas.width - (setSize/2)); }
        if(setY + (setHeight/2) > ctx.canvas.height) { setY = Math.floor(ctx.canvas.height - (setHeight/2)); }

        theArea.setX(setX);
        theArea.setY(setY);
        theArea.setSize(setSize);
        

        // Set cropping selection to 200, half canvas width, or half canvas height (whichever is smallest)
        // theArea.setSize(Math.min(200, ctx.canvas.width/2, ctx.canvas.height/2));
      } else {
        elCanvas.prop('width',0).prop('height',0).css({'margin-top': 0});
      }

      drawScene();
    };

    /**
     * Returns event.changedTouches directly if event is a TouchEvent.
     * If event is a jQuery event, return changedTouches of event.originalEvent
     */
    var getChangedTouches=function(event){
      if(angular.isDefined(event.changedTouches)){
        return event.changedTouches;
      }else{
        return event.originalEvent.changedTouches;
      }
    };

    var onMouseMove=function(e) {
      if(image!==null) {
        var offset=getElementOffset(ctx.canvas),
            pageX, pageY;
        if(e.type === 'touchmove') {
          pageX=getChangedTouches(e)[0].pageX;
          pageY=getChangedTouches(e)[0].pageY;
        } else {
          pageX=e.pageX;
          pageY=e.pageY;
        }
        theArea.processMouseMove(pageX-offset.left, pageY-offset.top);
        drawScene();
      }
    };

    var onMouseDown=function(e) {
      e.preventDefault();
      e.stopPropagation();
      if(image!==null) {
        var offset=getElementOffset(ctx.canvas),
            pageX, pageY;
        if(e.type === 'touchstart') {
          pageX=getChangedTouches(e)[0].pageX;
          pageY=getChangedTouches(e)[0].pageY;
        } else {
          pageX=e.pageX;
          pageY=e.pageY;
        }
        theArea.processMouseDown(pageX-offset.left, pageY-offset.top);
        drawScene();
      }
    };

    var onMouseUp=function(e) {
      if(image!==null) {
        var offset=getElementOffset(ctx.canvas),
            pageX, pageY;
        if(e.type === 'touchend') {
          pageX=getChangedTouches(e)[0].pageX;
          pageY=getChangedTouches(e)[0].pageY;
        } else {
          pageX=e.pageX;
          pageY=e.pageY;
        }
        theArea.processMouseUp(pageX-offset.left, pageY-offset.top);
        drawScene();
      }
    };

    this.getResultImageDataURI=function() {
      var temp_ctx, temp_canvas;
      temp_canvas = angular.element('<canvas></canvas>')[0];
      temp_ctx = temp_canvas.getContext('2d');
      temp_canvas.width = resImgWidth;
      temp_canvas.height = resImgHeight;
      if(image!==null){
        var areaWidth = theArea.getWidth(),
            areaHeight = theArea.getHeight();
        var xRatio=image.width/ctx.canvas.width,
            yRatio=image.height/ctx.canvas.height,
            xLeft=theArea.getX()-areaWidth/2,
            yTop=theArea.getY()-areaHeight/2;

        // prevent factoring beyond the original image dimensions
        while(areaWidth*xRatio > image.width) { areaWidth--; }
        while(areaHeight*yRatio > image.height) { areaHeight--; }

        temp_ctx.drawImage(image, xLeft*xRatio, yTop*yRatio, areaWidth*xRatio, areaHeight*yRatio, 0, 0, resImgWidth, resImgHeight);
      }
      if (resImgQuality!==null ){
        return temp_canvas.toDataURL(resImgFormat, resImgQuality);
      }
      return temp_canvas.toDataURL(resImgFormat);
    };

    this.setNewImageSource=function(imageSource, toMax, cropData) {
      image=null;
      resetCropHost(toMax);
      events.trigger('image-updated');
      if(!!imageSource) {
        var newImage = new Image();
        if(imageSource.substring(0,4).toLowerCase()==='http') {
          newImage.crossOrigin = 'anonymous';
        }
        newImage.onload = function(){
          events.trigger('load-done');

          // cropEXIF.getData(newImage,function(){
          //   var orientation=cropEXIF.getTag(newImage,'Orientation');

          //   if([3,6,8].indexOf(orientation)>-1) {
          //     var canvas = $document.createElement('canvas'),
          //         ctx=canvas.getContext('2d'),
          //         cw = newImage.width, ch = newImage.height, cx = 0, cy = 0, deg=0;
          //     switch(orientation) {
          //       case 3:
          //         cx=-newImage.width;
          //         cy=-newImage.height;
          //         deg=180;
          //         break;
          //       case 6:
          //         cw = newImage.height;
          //         ch = newImage.width;
          //         cy=-newImage.height;
          //         deg=90;
          //         break;
          //       case 8:
          //         cw = newImage.height;
          //         ch = newImage.width;
          //         cx=-newImage.width;
          //         deg=270;
          //         break;
          //     }

          //     canvas.width = cw;
          //     canvas.height = ch;
          //     ctx.rotate(deg*Math.PI/180);
          //     ctx.drawImage(newImage, cx, cy);

          //     image=new Image();
          //     image.src = canvas.toDataURL('image/png');
          //   } else {
              image=newImage;
            // }
            resetCropHost(toMax, cropData);
            events.trigger('image-updated');
          // });
        };
        newImage.onerror=function() {
          events.trigger('load-error');
        };
        events.trigger('load-start');
        newImage.src=imageSource;
      }
    };

    this.setMaxDimensions=function(width, height) {
      maxCanvasDims=[width,height];

      if(image!==null) {
        // when the canvas clientHeight is 0 it means that the canvas is hidden, so don't resize anything!
        if(elCanvas[0].clientHeight > 0){
          var curWidth=ctx.canvas.width,
              curHeight=ctx.canvas.height;

          var imageDims=[image.width, image.height],
              imageRatio=image.width/image.height,
              canvasDims=imageDims;

          if(canvasDims[0]>maxCanvasDims[0]) {
            canvasDims[0]=maxCanvasDims[0];
            canvasDims[1]=canvasDims[0]/imageRatio;
          } else if(canvasDims[0]<minCanvasDims[0]) {
            canvasDims[0]=minCanvasDims[0];
            canvasDims[1]=canvasDims[0]/imageRatio;
          }
          if(canvasDims[1]>maxCanvasDims[1]) {
            canvasDims[1]=maxCanvasDims[1];
            canvasDims[0]=canvasDims[1]*imageRatio;
          } else if(canvasDims[1]<minCanvasDims[1]) {
            canvasDims[1]=minCanvasDims[1];
            canvasDims[0]=canvasDims[1]*imageRatio;
          }
          elCanvas.prop('width',canvasDims[0]).prop('height',canvasDims[1]).css({'margin-left': -canvasDims[0]/2+'px', 'margin-top': -canvasDims[1]/2+'px'});

          var ratioNewCurWidth=ctx.canvas.width/curWidth,
              ratioNewCurHeight=ctx.canvas.height/curHeight,
              ratioMin=Math.min(ratioNewCurWidth, ratioNewCurHeight);

          theArea.setX(theArea.getX()*ratioNewCurWidth);
          theArea.setY(theArea.getY()*ratioNewCurHeight);
          theArea.setSize(theArea.getSize()*ratioMin);
        }
      } else {
        elCanvas.prop('width',0).prop('height',0).css({'margin-top': 0});
      }

      drawScene();

    };

    this.setAreaMinSize=function(size) {
      size=parseInt(size,10);
      if(!isNaN(size)) {
        theArea.setMinSize(size);
        drawScene();
      }
    };

    this.setResultImageSize=function(size) {
      size=parseInt(size,10);
      if(!isNaN(size)) {
        resImgSize=size;
        resImgWidth=resImgSize;
        resImgHeight=Math.floor(resImgAspect[1] * resImgWidth / resImgAspect[0]);
      }
    };

    this.setResultImageAspect=function(w, h) {
      w=parseInt(w,10);
      h=parseInt(h,10);
      if(!isNaN(w) && !isNaN(h)) {
        theArea.setAspect(w,h);
        var tempwidth = theArea.getWidth();
        // set the size with the new aspect ratio set
        theArea.setSize(tempwidth);
        resImgAspect=[w,h];
        resImgHeight=Math.floor(resImgAspect[1] * resImgWidth / resImgAspect[0]);
      }
    };

    this.setResultImageFormat=function(format) {
      resImgFormat = format;
    };

    this.setResultImageQuality=function(quality){
      quality = parseFloat(quality);
      if (!isNaN(quality) && quality>=0 && quality<=1){
        resImgQuality = quality;
      }
    };

    this.setAreaType=function(type) {
      var curSize=theArea.getSize(),
          curMinSize=theArea.getMinSize(),
          curX=theArea.getX(),
          curY=theArea.getY(),
          curRatio=theArea.getAspect();

      var AreaClass=CropAreaCircle;
      if(type==='square') {
        AreaClass=CropAreaSquare;
      }

      theArea = new AreaClass(ctx, events);
      theArea.setAspect(curRatio[0],curRatio[1]);
      theArea.setMinSize(curMinSize);
      theArea.setSize(curSize);
      theArea.setX(curX);
      theArea.setY(curY);

      // resetCropHost();
      if(image!==null) {
        theArea.setImage(image);
      }

      drawScene();
    };

    this.getArea=function() {
      return theArea;
    };

    this.getCanvas=function() {
      return ctx.canvas;
    };

    this.getImageWidth=function() {
      return (image !== null)? image.width : 0;
    };

    this.getImageHeight=function() {
      return (image !== null)? image.height : 0;
    };

    /* Life Cycle begins */

    // Init Context var
    ctx = elCanvas[0].getContext('2d');

    // Init CropArea
    theArea = new CropAreaCircle(ctx, events);

    // Init Mouse Event Listeners
    $document.on('mousemove',onMouseMove);
    elCanvas.on('mousedown',onMouseDown);
    $document.on('mouseup',onMouseUp);

    // Init Touch Event Listeners
    $document.on('touchmove',onMouseMove);
    elCanvas.on('touchstart',onMouseDown);
    $document.on('touchend',onMouseUp);

    // CropHost Destructor
    this.destroy=function() {
      $document.off('mousemove',onMouseMove);
      elCanvas.off('mousedown',onMouseDown);
      $document.off('mouseup',onMouseMove);

      $document.off('touchmove',onMouseMove);
      elCanvas.off('touchstart',onMouseDown);
      $document.off('touchend',onMouseMove);

      elCanvas.remove();
    };
  };

}]);


crop.factory('cropPubSub', [function() {
  return function() {
    var events = {};
    // Subscribe
    this.on = function(names, handler) {
      names.split(' ').forEach(function(name) {
        if (!events[name]) {
          events[name] = [];
        }
        events[name].push(handler);
      });
      return this;
    };
    // Publish
    this.trigger = function(name, args) {
      angular.forEach(events[name], function(handler) {
        handler.call(null, args);
      });
      return this;
    };
  };
}]);

crop.directive('imgCrop', ['$timeout', 'cropHost', 'cropPubSub', function($timeout, CropHost, CropPubSub) {
  return {
    restrict: 'E',
    scope: {
      image: '=',
      resultImage: '=',
      originalData: '=',
      cropData: '=',

      changeOnFly: '=',
      areaType: '@',
      areaMinSize: '=',
      resultImageSize: '=',
      resultImageAspect: '@',
      resultImageFormat: '@',
      resultImageQuality: '=',
      maximizeCrop: '=',

      onChange: '&',
      onLoadBegin: '&',
      onLoadDone: '&',
      onLoadError: '&'
    },
    template: '<canvas></canvas>',
    controller: ['$scope', function($scope) {
      $scope.events = new CropPubSub();
    }],
    link: function(scope, element, attrs) {
      // Init Events Manager
      var events = scope.events;
      var initialMax = true;

      // Init Crop Host
      var cropHost=new CropHost(element.find('canvas'), {}, events);

      // Store Result Image to check if it's changed
      var storedResultImage;

      var updateResultImage=function(scope) {
        if(scope.image !== ''){
          var imgWidth= cropHost.getImageWidth();
          var imgHeight= cropHost.getImageHeight();
          var cropArea = cropHost.getArea();
          var cropCanvas = cropHost.getCanvas();
          var aspectRatio = cropArea.getAspect();
          var calcHeight = Math.floor(cropArea.getWidth() * aspectRatio[1] / aspectRatio[0]);
          // if something changes and the crop ends up being taller than the allowable canvas height
          if(calcHeight > cropCanvas.height){
            // set the crop height to the canvas height
            cropArea.setHeight(cropCanvas.height);
          }

          if(angular.isDefined(scope.cropData) && imgWidth !== 0){
            var imgRatio= imgWidth/cropCanvas.width;

            scope.cropData= {
              width: Math.round(cropArea.getWidth()*imgRatio),
              height: Math.round(cropArea.getHeight()*imgRatio),
              x: Math.round((cropArea.getX() - (cropArea.getWidth()/2))*imgRatio),
              y: Math.round((cropArea.getY() - (cropArea.getHeight()/2))*imgRatio)
            };
          }
          if(angular.isDefined(scope.originalData) && imgWidth !== 0 && imgHeight !== 0){
            scope.originalData= {
              width: imgWidth,
              height: imgHeight
            };
          }
          if(angular.isDefined(scope.resultImage)){
            var resultImage=cropHost.getResultImageDataURI();
            if(storedResultImage!==resultImage) {
              storedResultImage=resultImage;
              if(angular.isDefined(scope.resultImage)) {
                scope.resultImage=resultImage;
              }
              scope.onChange({$dataURI: scope.resultImage});
            }
          }
        }
      };

      // Wrapper to safely exec functions within $apply on a running $digest cycle
      var fnSafeApply=function(fn) {
        return function(){
          $timeout(function(){
            scope.$apply(function(scope){
              fn(scope);
            });
          });
        };
      };

      // Setup CropHost Event Handlers
      events
        .on('load-start', fnSafeApply(function(scope){
          scope.onLoadBegin({});
        }))
        .on('load-done', fnSafeApply(function(scope){
          scope.onLoadDone({});
        }))
        .on('load-error', fnSafeApply(function(scope){
          scope.onLoadError({});
        }))
        .on('area-move area-resize', fnSafeApply(function(scope){
          if(!!scope.changeOnFly) {
            updateResultImage(scope);
          }
        }))
        .on('area-move-end area-resize-end image-updated', fnSafeApply(function(scope){
          updateResultImage(scope);
        }));

      // Sync CropHost with Directive's options
      scope.$watch('image',function(){
        var initCrop = {};

        // sometimes the image watcher is fired before the other scope variables are defined        
        $timeout(function(){
          var setToMaximum = (!!scope.maximizeCrop)? true : false;
          if(angular.isDefined(scope.cropData)){
            initCrop = scope.cropData;
          }
          cropHost.setNewImageSource(scope.image, setToMaximum, initCrop);
        }, 100);
      });
      scope.$watch('areaType',function(){
        cropHost.setAreaType(scope.areaType);
        updateResultImage(scope);
      });
      scope.$watch('areaMinSize',function(){
        cropHost.setAreaMinSize(scope.areaMinSize);
        updateResultImage(scope);
      });
      scope.$watch('resultImageSize',function(){
        cropHost.setResultImageSize(scope.resultImageSize);
        updateResultImage(scope);
      });
      // takes aspect ratio in string format (4x3,3x2,2x5,etc)...
      scope.$watch('resultImageAspect',function(){
        if(typeof scope.resultImageAspect !== 'undefined'){
          // split string into 2 parts
          var aspect = scope.resultImageAspect.toLowerCase().split('x');
          // if there are 2 parts, and each part is a valid integer
          if(aspect.length === 2 && !isNaN(parseInt(aspect[0],10)) && !isNaN(parseInt(aspect[1],10))){
            cropHost.setResultImageAspect(parseInt(aspect[0],10),parseInt(aspect[1],10));
            updateResultImage(scope);
          }
        }
      });
      scope.$watch('resultImageFormat',function(){
        cropHost.setResultImageFormat(scope.resultImageFormat);
        updateResultImage(scope);
      });
      scope.$watch('resultImageQuality',function(){
        cropHost.setResultImageQuality(scope.resultImageQuality);
        updateResultImage(scope);
      });
      scope.$watch('maximizeCrop',function(){
        var setToMaximum = (!!scope.maximizeCrop)? true : false;
        // the 'image' watcher will maximizeCrop, so we only want to setNewImageSource
        // if 'maxmizeCrop' is changed after the initial load
        if (angular.isDefined(scope.image) && !initialMax) {
          cropHost.setNewImageSource(scope.image, setToMaximum);
        } else {
          initialMax = false;
        }
      });

      // Update CropHost dimensions when the directive element is resized
      scope.$watch(
        function () {
          return [element[0].clientWidth, element[0].clientHeight];
        },
        function (value) {
          cropHost.setMaxDimensions(value[0],value[1]);
          updateResultImage(scope);
        },
        true
      );

      // Destroy CropHost Instance when the directive is destroying
      scope.$on('$destroy', function(){
          cropHost.destroy();
      });
    }
  };
}]);

crop.directive('imgCropResult', function() {
  return {
    restrict: 'A',
    scope: {
      image: '=',
      cropData: '=',
      originalData: '=',
      width: '@'
    },
    template: '<div class="imgCropResultContainer"><img /></div>',
    link: function(scope, element, attrs) {
      var result_div = angular.element(element[0].querySelector('.imgCropResultContainer'));
      var result_img = element.find('img')[0];
      var result_img_width = 0;
      var result_img_height = 0;
      var div_height = 0;
      var current_source;
      var cur_aspect;

      var watch_triggered = function() {
        // only update the resulting image, if both the image path and dimensions are set
        if(angular.isDefined(scope.image) && scope.image !== '' && angular.isDefined(scope.cropData) && typeof scope.cropData.width !== 'undefined') {
          updateImage();
        }
      };

      var updateImage = function(){
        var temp_image;
        var new_aspect = Math.round( 100 * scope.cropData.width / scope.cropData.height );
        // only change the div's height if the aspect ratio is adjusted
        if(new_aspect !== cur_aspect){
          cur_aspect = new_aspect;
          div_height = Math.round( 100000 * scope.cropData.height / scope.cropData.width ) / 1000;
          // padding scales proportionately with width, height scales to the window
          result_div.css({'padding-top': div_height+'%'});
        }
        // if the image path changes, we need to wait for it to load before updating the result
        if(scope.image !== current_source){
          current_source = scope.image;
          // only use the img.onload if we're not already passing the original dimensions in
          if(!angular.isDefined(scope.originalData) || typeof scope.originalData.width === 'undefined' || scope.originalData.width === 0){
            temp_image = new Image();
            // we need to gather the new image's natural dimensions
            // angular.element(result_img).css({ 'width' : 'auto' });
            temp_image.onload = function(){
              // save the width and height of the generated img, before we adjust it
              result_img_width = temp_image.width;
              result_img_height = temp_image.height;

              setNewData();
            };
            temp_image.src = scope.image;
          }else{
            result_img_width = scope.originalData.width;
            result_img_height = scope.originalData.height;

            setNewData();
          }
          result_img.src = scope.image;
        }else{
          setNewData();
        }
      };

      var setNewData = function(){
        // round all percentages to the nearest thousandth (pretty accurate even on larger images)
        var w = Math.round( 100000 * result_img_width / scope.cropData.width ) / 1000,
        h = Math.round( 100000 * result_img_height / scope.cropData.height ) / 1000,
        x = Math.floor( 1000 * w * scope.cropData.x / result_img_width ) * -1 / 1000,
        y = Math.floor( 1000 * h * scope.cropData.y  / result_img_height ) * -1 / 1000;
        
        angular.element(result_img).css({
          'width' : w+'%',
          'left' : x+'%',
          'top' : y+'%'
        });
      };

      scope.$watch('image', function(){
        watch_triggered();
      });
      scope.$watch('cropData', function(){
        watch_triggered();
      });
      scope.$watch('width', function(){
        // if it's an integer, append 'px' to the value
        var px = ((parseFloat(scope.width) === parseInt(scope.width)) && !isNaN(scope.width))? 'px' : '';
        element.css({ 'width' : scope.width+px });
      });
    }
  };
});

}());