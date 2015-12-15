/*!
 * ngImgCropExtendedDrmc v0.4.7
 * https://github.com/drmikecrowe/ngImgCropExtended/
 *
 * Copyright (c) 2015 undefined
 * License: MIT
 *
 * Generated at Tuesday, December 15th, 2015, 3:39:53 PM
 */
(function() {
var crop = angular.module('ngImgCrop', []);

crop.factory('cropAreaCircle', ['cropArea', function(CropArea) {
    var CropAreaCircle = function() {
        CropArea.apply(this, arguments);

        this._boxResizeBaseSize = 30;
        this._boxResizeNormalRatio = 0.9;
        this._boxResizeHoverRatio = 1.2;
        this._iconMoveNormalRatio = 0.9;
        this._iconMoveHoverRatio = 1.2;

        this._boxResizeNormalSize = this._boxResizeBaseSize * this._boxResizeNormalRatio;
        this._boxResizeHoverSize = this._boxResizeBaseSize * this._boxResizeHoverRatio;

        this._posDragStartX = 0;
        this._posDragStartY = 0;
        this._posResizeStartX = 0;
        this._posResizeStartY = 0;
        this._posResizeStartSize = 0;

        this._boxResizeIsHover = false;
        this._areaIsHover = false;
        this._boxResizeIsDragging = false;
        this._areaIsDragging = false;
    };

    CropAreaCircle.prototype = new CropArea();

    CropAreaCircle.prototype.getType = function() {
        return 'circle';
    }

    CropAreaCircle.prototype._calcCirclePerimeterCoords = function(angleDegrees) {
        var hSize = this._size.w / 2;
        var angleRadians = angleDegrees * (Math.PI / 180),
            circlePerimeterX = this.getCenterPoint().x + hSize * Math.cos(angleRadians),
            circlePerimeterY = this.getCenterPoint().y + hSize * Math.sin(angleRadians);
        return [circlePerimeterX, circlePerimeterY];
    };

    CropAreaCircle.prototype._calcResizeIconCenterCoords = function() {
        return this._calcCirclePerimeterCoords(-45);
    };

    CropAreaCircle.prototype._isCoordWithinArea = function(coord) {
        return Math.sqrt((coord[0] - this.getCenterPoint().x) * (coord[0] - this.getCenterPoint().x) + (coord[1] - this.getCenterPoint().y) * (coord[1] - this.getCenterPoint().y)) < this._size.w / 2;
    };
    CropAreaCircle.prototype._isCoordWithinBoxResize = function(coord) {
        var resizeIconCenterCoords = this._calcResizeIconCenterCoords();
        var hSize = this._boxResizeHoverSize / 2;
        return (coord[0] > resizeIconCenterCoords[0] - hSize && coord[0] < resizeIconCenterCoords[0] + hSize &&
            coord[1] > resizeIconCenterCoords[1] - hSize && coord[1] < resizeIconCenterCoords[1] + hSize);
    };

    CropAreaCircle.prototype._drawArea = function(ctx, centerCoords, size) {
        ctx.arc(centerCoords.x, centerCoords.y, size.w / 2, 0, 2 * Math.PI);
    };

    CropAreaCircle.prototype.draw = function() {
        CropArea.prototype.draw.apply(this, arguments);

        // draw move icon
        var center = this.getCenterPoint();
        this._cropCanvas.drawIconMove([center.x, center.y], this._areaIsHover ? this._iconMoveHoverRatio : this._iconMoveNormalRatio);

        // draw resize cubes
        this._cropCanvas.drawIconResizeBoxNESW(this._calcResizeIconCenterCoords(), this._boxResizeBaseSize, this._boxResizeIsHover ? this._boxResizeHoverRatio : this._boxResizeNormalRatio);
    };

    CropAreaCircle.prototype.processMouseMove = function(mouseCurX, mouseCurY) {
        var cursor = 'default';
        var res = false;

        this._boxResizeIsHover = false;
        this._areaIsHover = false;

        if (this._areaIsDragging) {
            this.setCenterPoint({
                x: mouseCurX - this._posDragStartX,
                y: mouseCurY - this._posDragStartY
            });
            this._areaIsHover = true;
            cursor = 'move';
            res = true;
            this._events.trigger('area-move');
        } else if (this._boxResizeIsDragging) {
            cursor = 'nesw-resize';
            var iFR, iFX, iFY;
            iFX = mouseCurX - this._posResizeStartX;
            iFY = this._posResizeStartY - mouseCurY;
            if (iFX > iFY) {
                iFR = this._posResizeStartSize.w + iFY * 2;
            } else {
                iFR = this._posResizeStartSize.w + iFX * 2;
            }

            var center = this.getCenterPoint(),
                newNO = {},
                newSE = {};

            newNO.x = this.getCenterPoint().x - iFR * 0.5;
            newSE.x = this.getCenterPoint().x + iFR * 0.5;

            newNO.y = this.getCenterPoint().y - iFR * 0.5;
            newSE.y = this.getCenterPoint().y + iFR * 0.5;

            this.setSizeByCorners(newNO, newSE);
            this._boxResizeIsHover = true;
            res = true;
            this._events.trigger('area-resize');
        } else if (this._isCoordWithinBoxResize([mouseCurX, mouseCurY])) {
            cursor = 'nesw-resize';
            this._areaIsHover = false;
            this._boxResizeIsHover = true;
            res = true;
        } else if (this._isCoordWithinArea([mouseCurX, mouseCurY])) {
            cursor = 'move';
            this._areaIsHover = true;
            res = true;
        }

        //this._dontDragOutside();
        angular.element(this._ctx.canvas).css({
            'cursor': cursor
        });

        return res;
    };

    CropAreaCircle.prototype.processMouseDown = function(mouseDownX, mouseDownY) {
        if (this._isCoordWithinBoxResize([mouseDownX, mouseDownY])) {
            this._areaIsDragging = false;
            this._areaIsHover = false;
            this._boxResizeIsDragging = true;
            this._boxResizeIsHover = true;
            this._posResizeStartX = mouseDownX;
            this._posResizeStartY = mouseDownY;
            this._posResizeStartSize = this._size;
            this._events.trigger('area-resize-start');
        } else if (this._isCoordWithinArea([mouseDownX, mouseDownY])) {
            this._areaIsDragging = true;
            this._areaIsHover = true;
            this._boxResizeIsDragging = false;
            this._boxResizeIsHover = false;
            var center = this.getCenterPoint();
            this._posDragStartX = mouseDownX - center.x;
            this._posDragStartY = mouseDownY - center.y;
            this._events.trigger('area-move-start');
        }
    };

    CropAreaCircle.prototype.processMouseUp = function( /*mouseUpX, mouseUpY*/ ) {
        if (this._areaIsDragging) {
            this._areaIsDragging = false;
            this._events.trigger('area-move-end');
        }
        if (this._boxResizeIsDragging) {
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

crop.factory('cropAreaRectangle', ['cropArea', function(CropArea) {
    var CropAreaRectangle = function() {
        CropArea.apply(this, arguments);

        this._resizeCtrlBaseRadius = 15;
        this._resizeCtrlNormalRatio = 0.75;
        this._resizeCtrlHoverRatio = 1;
        this._iconMoveNormalRatio = 0.9;
        this._iconMoveHoverRatio = 1.2;

        this._resizeCtrlNormalRadius = this._resizeCtrlBaseRadius * this._resizeCtrlNormalRatio;
        this._resizeCtrlHoverRadius = this._resizeCtrlBaseRadius * this._resizeCtrlHoverRatio;

        this._posDragStartX = 0;
        this._posDragStartY = 0;
        this._posResizeStartX = 0;
        this._posResizeStartY = 0;
        this._posResizeStartSize = {
            w: 0,
            h: 0
        };

        this._resizeCtrlIsHover = -1;
        this._areaIsHover = false;
        this._resizeCtrlIsDragging = -1;
        this._areaIsDragging = false;
    };

    CropAreaRectangle.prototype = new CropArea();

    // return a type string
    CropAreaRectangle.prototype.getType = function() {
        return 'rectangle';
    }

    CropAreaRectangle.prototype._calcRectangleCorners = function() {
        var size = this.getSize();
        var se = this.getSouthEastBound();
        return [
            [size.x, size.y], //northwest
            [se.x, size.y], //northeast
            [size.x, se.y], //southwest
            [se.x, se.y] //southeast
        ];
    };

    CropAreaRectangle.prototype._calcRectangleDimensions = function() {
        var size = this.getSize();
        var se = this.getSouthEastBound();
        return {
            left: size.x,
            top: size.y,
            right: se.x,
            bottom: se.y
        };
    };

    CropAreaRectangle.prototype._isCoordWithinArea = function(coord) {
        var rectangleDimensions = this._calcRectangleDimensions();
        return (coord[0] >= rectangleDimensions.left && coord[0] <= rectangleDimensions.right && coord[1] >= rectangleDimensions.top && coord[1] <= rectangleDimensions.bottom);
    };

    CropAreaRectangle.prototype._isCoordWithinResizeCtrl = function(coord) {
        var resizeIconsCenterCoords = this._calcRectangleCorners();
        var res = -1;
        for (var i = 0, len = resizeIconsCenterCoords.length; i < len; i++) {
            var resizeIconCenterCoords = resizeIconsCenterCoords[i];
            if (coord[0] > resizeIconCenterCoords[0] - this._resizeCtrlHoverRadius && coord[0] < resizeIconCenterCoords[0] + this._resizeCtrlHoverRadius &&
                coord[1] > resizeIconCenterCoords[1] - this._resizeCtrlHoverRadius && coord[1] < resizeIconCenterCoords[1] + this._resizeCtrlHoverRadius) {
                res = i;
                break;
            }
        }
        return res;
    };

    CropAreaRectangle.prototype._drawArea = function(ctx, center, size) {
        ctx.rect(size.x, size.y, size.w, size.h);
    };

    CropAreaRectangle.prototype.draw = function() {
        CropArea.prototype.draw.apply(this, arguments);

        var center = this.getCenterPoint();
        // draw move icon
        this._cropCanvas.drawIconMove([center.x, center.y], this._areaIsHover ? this._iconMoveHoverRatio : this._iconMoveNormalRatio);

        // draw resize thumbs
        var resizeIconsCenterCoords = this._calcRectangleCorners();
        for (var i = 0, len = resizeIconsCenterCoords.length; i < len; i++) {
            var resizeIconCenterCoords = resizeIconsCenterCoords[i];
            this._cropCanvas.drawIconResizeCircle(resizeIconCenterCoords, this._resizeCtrlBaseRadius, this._resizeCtrlIsHover === i ? this._resizeCtrlHoverRatio : this._resizeCtrlNormalRatio);
        }
    };

    CropAreaRectangle.prototype.processMouseMove = function(mouseCurX, mouseCurY) {
        var cursor = 'default';
        var res = false;

        this._resizeCtrlIsHover = -1;
        this._areaIsHover = false;

        if (this._areaIsDragging) {
            this.setCenterPoint({
                x: mouseCurX - this._posDragStartX,
                y: mouseCurY - this._posDragStartY
            });
            this._areaIsHover = true;
            cursor = 'move';
            res = true;
            this._events.trigger('area-move');
        } else if (this._resizeCtrlIsDragging > -1) {
            var s = this.getSize();
            var se = this.getSouthEastBound();
            var posX = mouseCurX;
            switch (this._resizeCtrlIsDragging) {
                case 0: // Top Left
                    if(this._aspect) posX = se.x-((se.y-mouseCurY)*this._aspect);
                    this.setSizeByCorners({
                        x: posX,
                        y: mouseCurY
                    }, {
                        x: se.x,
                        y: se.y
                    });
                    cursor = 'nwse-resize';
                    break;
                case 1: // Top Right
                    if(this._aspect) posX = s.x+((se.y-mouseCurY)*this._aspect);
                    this.setSizeByCorners({
                        x: s.x,
                        y: mouseCurY
                    }, {
                        x: posX,
                        y: se.y
                    });
                    cursor = 'nesw-resize';
                    break;
                case 2: // Bottom Left
                    if(this._aspect) posX = se.x-((mouseCurY-s.y)*this._aspect);
                    this.setSizeByCorners({
                        x: posX,
                        y: s.y
                    }, {
                        x: se.x,
                        y: mouseCurY
                    });
                    cursor = 'nesw-resize';
                    break;
                case 3: // Bottom Right
                    if(this._aspect) posX = s.x+((mouseCurY-s.y)*this._aspect);
                    this.setSizeByCorners({
                        x: s.x,
                        y: s.y
                    }, {
                        x: posX,
                        y: mouseCurY
                    });
                    cursor = 'nwse-resize';
                    break;
            }

            this._resizeCtrlIsHover = this._resizeCtrlIsDragging;
            res = true;
            this._events.trigger('area-resize');
        } else {
            var hoveredResizeBox = this._isCoordWithinResizeCtrl([mouseCurX, mouseCurY]);
            if (hoveredResizeBox > -1) {
                switch (hoveredResizeBox) {
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
                res = true;
            } else if (this._isCoordWithinArea([mouseCurX, mouseCurY])) {
                cursor = 'move';
                this._areaIsHover = true;
                res = true;
            }
        }

        angular.element(this._ctx.canvas).css({
            'cursor': cursor
        });

        return res;
    };

    CropAreaRectangle.prototype.processMouseDown = function(mouseDownX, mouseDownY) {
        var isWithinResizeCtrl = this._isCoordWithinResizeCtrl([mouseDownX, mouseDownY]);
        if (isWithinResizeCtrl > -1) {
            this._areaIsDragging = false;
            this._areaIsHover = false;
            this._resizeCtrlIsDragging = isWithinResizeCtrl;
            this._resizeCtrlIsHover = isWithinResizeCtrl;
            this._posResizeStartX = mouseDownX;
            this._posResizeStartY = mouseDownY;
            this._posResizeStartSize = this._size;
            this._events.trigger('area-resize-start');
        } else if (this._isCoordWithinArea([mouseDownX, mouseDownY])) {
            this._areaIsDragging = true;
            this._areaIsHover = true;
            this._resizeCtrlIsDragging = -1;
            this._resizeCtrlIsHover = -1;
            var center = this.getCenterPoint();
            this._posDragStartX = mouseDownX - center.x;
            this._posDragStartY = mouseDownY - center.y;
            this._events.trigger('area-move-start');
        }
    };

    CropAreaRectangle.prototype.processMouseUp = function( /*mouseUpX, mouseUpY*/ ) {
        if (this._areaIsDragging) {
            this._areaIsDragging = false;
            this._events.trigger('area-move-end');
        }
        if (this._resizeCtrlIsDragging > -1) {
            this._resizeCtrlIsDragging = -1;
            this._events.trigger('area-resize-end');
        }
        this._areaIsHover = false;
        this._resizeCtrlIsHover = -1;

        this._posDragStartX = 0;
        this._posDragStartY = 0;
    };

    return CropAreaRectangle;
}]);

crop.factory('cropAreaSquare', ['cropArea', function(CropArea) {
    var CropAreaSquare = function() {
        CropArea.apply(this, arguments);

        this._resizeCtrlBaseRadius = 15;
        this._resizeCtrlNormalRatio = 0.75;
        this._resizeCtrlHoverRatio = 1;
        this._iconMoveNormalRatio = 0.9;
        this._iconMoveHoverRatio = 1.2;

        this._resizeCtrlNormalRadius = this._resizeCtrlBaseRadius * this._resizeCtrlNormalRatio;
        this._resizeCtrlHoverRadius = this._resizeCtrlBaseRadius * this._resizeCtrlHoverRatio;

        this._posDragStartX = 0;
        this._posDragStartY = 0;
        this._posResizeStartX = 0;
        this._posResizeStartY = 0;
        this._posResizeStartSize = 0;

        this._resizeCtrlIsHover = -1;
        this._areaIsHover = false;
        this._resizeCtrlIsDragging = -1;
        this._areaIsDragging = false;
    };

    CropAreaSquare.prototype = new CropArea();

    CropAreaSquare.prototype.getType = function() {
        return 'square';
    };

    CropAreaSquare.prototype._calcSquareCorners = function() {
        var size = this.getSize(),
            se = this.getSouthEastBound();
        return [
            [size.x, size.y], //northwest
            [se.x, size.y], //northeast
            [size.x, se.y], //southwest
            [se.x, se.y] //southeast
        ];
    };

    CropAreaSquare.prototype._calcSquareDimensions = function() {
        var size = this.getSize(),
            se = this.getSouthEastBound();
        return {
            left: size.x,
            top: size.y,
            right: se.x,
            bottom: se.y
        };
    };

    CropAreaSquare.prototype._isCoordWithinArea = function(coord) {
        var squareDimensions = this._calcSquareDimensions();
        return (coord[0] >= squareDimensions.left && coord[0] <= squareDimensions.right && coord[1] >= squareDimensions.top && coord[1] <= squareDimensions.bottom);
    };

    CropAreaSquare.prototype._isCoordWithinResizeCtrl = function(coord) {
        var resizeIconsCenterCoords = this._calcSquareCorners();
        var res = -1;
        for (var i = 0, len = resizeIconsCenterCoords.length; i < len; i++) {
            var resizeIconCenterCoords = resizeIconsCenterCoords[i];
            if (coord[0] > resizeIconCenterCoords[0] - this._resizeCtrlHoverRadius && coord[0] < resizeIconCenterCoords[0] + this._resizeCtrlHoverRadius &&
                coord[1] > resizeIconCenterCoords[1] - this._resizeCtrlHoverRadius && coord[1] < resizeIconCenterCoords[1] + this._resizeCtrlHoverRadius) {
                res = i;
                break;
            }
        }
        return res;
    };

    CropAreaSquare.prototype._drawArea = function(ctx, centerCoords, size) {
        var hSize = size / 2;
        ctx.rect(size.x, size.y, size.w, size.h);
    };

    CropAreaSquare.prototype.draw = function() {
        CropArea.prototype.draw.apply(this, arguments);

        // draw move icon
        var center = this.getCenterPoint();
        this._cropCanvas.drawIconMove([center.x, center.y], this._areaIsHover ? this._iconMoveHoverRatio : this._iconMoveNormalRatio);

        // draw resize cubes
        var resizeIconsCenterCoords = this._calcSquareCorners();
        for (var i = 0, len = resizeIconsCenterCoords.length; i < len; i++) {
            var resizeIconCenterCoords = resizeIconsCenterCoords[i];
            this._cropCanvas.drawIconResizeCircle(resizeIconCenterCoords, this._resizeCtrlBaseRadius, this._resizeCtrlIsHover === i ? this._resizeCtrlHoverRatio : this._resizeCtrlNormalRatio);
        }
    };

    CropAreaSquare.prototype.processMouseMove = function(mouseCurX, mouseCurY) {
        var cursor = 'default';
        var res = false;

        this._resizeCtrlIsHover = -1;
        this._areaIsHover = false;

        if (this._areaIsDragging) {
            this.setCenterPoint({
                x: mouseCurX - this._posDragStartX,
                y: mouseCurY - this._posDragStartY
            });
            this._areaIsHover = true;
            cursor = 'move';
            res = true;
            this._events.trigger('area-move');
        } else if (this._resizeCtrlIsDragging > -1) {
            var xMulti, yMulti;
            switch (this._resizeCtrlIsDragging) {
                case 0: // Top Left
                    xMulti = -1;
                    yMulti = -1;
                    cursor = 'nwse-resize';
                    break;
                case 1: // Top Right
                    xMulti = 1;
                    yMulti = -1;
                    cursor = 'nesw-resize';
                    break;
                case 2: // Bottom Left
                    xMulti = -1;
                    yMulti = 1;
                    cursor = 'nesw-resize';
                    break;
                case 3: // Bottom Right
                    xMulti = 1;
                    yMulti = 1;
                    cursor = 'nwse-resize';
                    break;
            }
            var iFX = (mouseCurX - this._posResizeStartX) * xMulti,
                iFY = (mouseCurY - this._posResizeStartY) * yMulti,
                iFR;
            if (iFX > iFY) {
                iFR = this._posResizeStartSize.w + iFY;
            } else {
                iFR = this._posResizeStartSize.w + iFX;
            }
            var newSize = Math.max(this._minSize.w, iFR),
                newNO = {},
                newSE = {},
                newSO = {},
                newNE = {},
                s = this.getSize(),
                se = this.getSouthEastBound();
            switch (this._resizeCtrlIsDragging) {
                case 0: // Top Left
                    newNO.x = se.x - newSize;
                    newNO.y = se.y - newSize;
                    if(newNO.y > 0) {
                        this.setSizeByCorners(newNO, {
                            x: se.x,
                            y: se.y
                        });
                    }
                    cursor = 'nwse-resize';
                    break;
                case 1: // Top Right
                    if(iFX >= 0 && iFY >= 0) {
                        //Move to top/right, increase
                        newNE.x = s.x + newSize;
                        newNE.y = se.y - newSize;
                    } else if(iFX < 0 || iFY < 0) {
                        //else decrease
                        newNE.x = s.x + newSize;
                        newNE.y = se.y - newSize;
                    }
                    if(newNE.y > 0) {
                        this.setSizeByCorners({
                            x: s.x,
                            y: newNE.y
                        }, {
                            x: newNE.x,
                            y: se.y
                        });
                    }
                    cursor = 'nesw-resize';
                    break;
                case 2: // Bottom Left
                    if(iFX >= 0 && iFY >= 0) {
                        //Move to bottom/left, increase
                        newSO.x = se.x - newSize;
                        newSO.y = s.y + newSize;
                    } else if(iFX <= 0 || iFY <= 0) {
                        //else decrease
                        newSO.x = se.x - newSize;
                        newSO.y = s.y + newSize;
                    }
                    if(newSO.y < this._ctx.canvas.height) {
                        this.setSizeByCorners({
                            x: newSO.x,
                            y: s.y
                        }, {
                            x: se.x,
                            y: newSO.y
                        });
                    }
                    cursor = 'nesw-resize';
                    break;
                case 3: // Bottom Right

                    newSE.x = s.x + newSize;
                    newSE.y = s.y + newSize;

                    if(newSE.y < this._ctx.canvas.height) {
                        this.setSizeByCorners({
                            x: s.x,
                            y: s.y
                        }, newSE);
                    }
                    cursor = 'nwse-resize';
                    break;
            }
            this._resizeCtrlIsHover = this._resizeCtrlIsDragging;
            res = true;
            this._events.trigger('area-resize');
        } else {
            var hoveredResizeBox = this._isCoordWithinResizeCtrl([mouseCurX, mouseCurY]);
            if (hoveredResizeBox > -1) {
                switch (hoveredResizeBox) {
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
                res = true;
            } else if (this._isCoordWithinArea([mouseCurX, mouseCurY])) {
                cursor = 'move';
                this._areaIsHover = true;
                res = true;
            }
        }

        angular.element(this._ctx.canvas).css({
            'cursor': cursor
        });

        return res;
    };

    CropAreaSquare.prototype.processMouseDown = function(mouseDownX, mouseDownY) {
        var isWithinResizeCtrl = this._isCoordWithinResizeCtrl([mouseDownX, mouseDownY]);
        if (isWithinResizeCtrl > -1) {
            this._areaIsDragging = false;
            this._areaIsHover = false;
            this._resizeCtrlIsDragging = isWithinResizeCtrl;
            this._resizeCtrlIsHover = isWithinResizeCtrl;
            this._posResizeStartX = mouseDownX;
            this._posResizeStartY = mouseDownY;
            this._posResizeStartSize = this._size;
            this._events.trigger('area-resize-start');
        } else if (this._isCoordWithinArea([mouseDownX, mouseDownY])) {
            this._areaIsDragging = true;
            this._areaIsHover = true;
            this._resizeCtrlIsDragging = -1;
            this._resizeCtrlIsHover = -1;
            var center = this.getCenterPoint();
            this._posDragStartX = mouseDownX - center.x;
            this._posDragStartY = mouseDownY - center.y;
            this._events.trigger('area-move-start');
        }
    };

    CropAreaSquare.prototype.processMouseUp = function( /*mouseUpX, mouseUpY*/ ) {
        if (this._areaIsDragging) {
            this._areaIsDragging = false;
            this._events.trigger('area-move-end');
        }
        if (this._resizeCtrlIsDragging > -1) {
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
        this._ctx = ctx;
        this._events = events;

        this._minSize = {
            x: 0,
            y: 0,
            w: 80,
            h: 80
        };

        this._forceAspectRatio = false;
        this._aspect = null;

        this._cropCanvas = new CropCanvas(ctx);

        this._image = new Image();
        this._size = {
            x: 0,
            y: 0,
            w: 150,
            h: 150
        };
    };

    /* GETTERS/SETTERS */

    CropArea.prototype.getImage = function() {
        return this._image;
    };
    CropArea.prototype.setImage = function(image) {
        this._image = image;
    };

    CropArea.prototype.setForceAspectRatio = function(force) {
        this._forceAspectRatio = force;
    };

    CropArea.prototype.setAspect = function(aspect) {
        this._aspect=aspect;
    }

    CropArea.prototype.getSize = function() {
        return this._size;
    };

    CropArea.prototype.setSize = function(size) {
        size = this._processSize(size);
        this._size = this._preventBoundaryCollision(size);
    };

    CropArea.prototype.setSizeByCorners = function(northWestCorner, southEastCorner) {

        var size = {
            x: northWestCorner.x,
            y: northWestCorner.y,
            w: southEastCorner.x - northWestCorner.x,
            h: southEastCorner.y - northWestCorner.y
        };
        this.setSize(size);
    };

    CropArea.prototype.getSouthEastBound = function() {
        return this._southEastBound(this.getSize());
    };

    CropArea.prototype.getMinSize = function() {
        return this._minSize;
    };

    CropArea.prototype.getCenterPoint = function() {
        var s = this.getSize();
        return {
            x: s.x + (s.w / 2),
            y: s.y + (s.h / 2)
        };
    };

    CropArea.prototype.setCenterPoint = function(point) {
        var s = this.getSize();
        this.setSize({
            x: point.x - s.w / 2,
            y: point.y - s.h / 2,
            w: s.w,
            h: s.h
        });
    };

    CropArea.prototype.setMinSize = function(size) {
        this._minSize = this._processSize(size);
        this.setSize(this._minSize);
    };

    // return a type string
    CropArea.prototype.getType = function() {
        //default to circle
        return 'circle';
    }

    /* FUNCTIONS */
    CropArea.prototype._preventBoundaryCollision = function(size) {
        var canvasH = this._ctx.canvas.height,
            canvasW = this._ctx.canvas.width;

        var nw = {
            x: size.x,
            y: size.y
        };
        var se = this._southEastBound(size);

        // check northwest corner
        if (nw.x < 0) {
            nw.x = 0;
        }
        if (nw.y < 0) {
            nw.y = 0;
        }

        // check southeast corner
        if (se.x > canvasW) {
            se.x = canvasW
        }
        if (se.y > canvasH) {
            se.y = canvasH
        }

        var newSizeWidth = (this._forceAspectRatio) ? size.w : se.x - nw.x,
            newSizeHeight = (this._forceAspectRatio) ? size.h : se.y - nw.y;

        // save rectangle scale
        if(this._aspect){
            newSizeWidth = newSizeHeight * this._aspect;
            if(nw.x+newSizeWidth>canvasW){
                newSizeWidth=canvasW-nw.x;
                newSizeHeight=newSizeWidth/this._aspect;
                if(this._minSize.w>newSizeWidth) newSizeWidth=this._minSize.w;
                if(this._minSize.h>newSizeHeight) newSizeHeight=this._minSize.h;
                nw.x=canvasW-newSizeWidth;
            }
            if(nw.y+newSizeHeight>canvasH) nw.y=canvasH-newSizeHeight;
        }

        // save square scale
        if(this._forceAspectRatio) {
            newSizeWidth = newSizeHeight;
            if(nw.x+newSizeWidth>canvasW){
                newSizeWidth=canvasW-nw.x;
                if(newSizeWidth<this._minSize.w) newSizeWidth=this._minSize.w;
                newSizeHeight=newSizeWidth;
            }
        }

        var newSize = {
            x: nw.x,
            y: nw.y,
            w: newSizeWidth,
            h: newSizeHeight
        };

        //check size (if < min, adjust nw corner)
        if ( (newSize.w < this._minSize.w) && !this._forceAspectRatio) {
            newSize.w = this._minSize.w;
            se = this._southEastBound(newSize);
            //adjust se corner, if it's out of bounds
            if (se.x > canvasW) {
                se.x = canvasW;
                //adjust nw corner according to min width
                nw.x = Math.max(se.x - canvasW, se.x - this._minSize.w);
                newSize = {
                    x: nw.x,
                    y: nw.y,
                    w: se.x - nw.x,
                    h: se.y - nw.y
                };
            }
        }

        if ( (newSize.h < this._minSize.h) && !this._forceAspectRatio) {
            newSize.h = this._minSize.h;
            se = this._southEastBound(newSize);

            if (se.y > canvasH) {
                se.y = canvasH;
                //adjust nw corner according to min height
                nw.y = Math.max(se.y - canvasH, se.y - this._minSize.h);
                newSize = {
                    x: nw.x,
                    y: nw.y,
                    w: se.x - nw.x,
                    h: se.y - nw.y
                };
            }
        }

        if(this._forceAspectRatio) {
            //check if outside SE bound
            se = this._southEastBound(newSize);
            if (se.y > canvasH) {
                newSize.y = canvasH - newSize.h;
            }
            if (se.x > canvasW) {
                newSize.x = canvasW - newSize.w;
            }
        }

        return newSize;
    };

    CropArea.prototype._dontDragOutside = function() {
        var h = this._ctx.canvas.height,
            w = this._ctx.canvas.width;

        if (this._width > w) {
            this._width = w;
        }
        if (this._height > h) {
            this._height = h;
        }
        if (this._x < this._width / 2) {
            this._x = this._width / 2;
        }
        if (this._x > w - this._width / 2) {
            this._x = w - this._width / 2;
        }
        if (this._y < this._height / 2) {
            this._y = this._height / 2;
        }
        if (this._y > h - this._height / 2) {
            this._y = h - this._height / 2;
        }
    };

    CropArea.prototype._drawArea = function() {};

    CropArea.prototype._processSize = function(size) {
        // make this polymorphic to accept a single floating point number
        // for square-like sizes (including circle)
        if (typeof size == "number") {
            size = {
                w: size,
                h: size
            };
        }
        var width = size.w;
        if(this._aspect) width = size.h * this._aspect;
        return {
            x: size.x || this._minSize.x,
            y: size.y || this._minSize.y,
            w: width || this._minSize.w,
            h: size.h || this._minSize.h
        };
    }

    CropArea.prototype._southEastBound = function(size) {
        return {
            x: size.x + size.w,
            y: size.y + size.h
        };
    }
    CropArea.prototype.draw = function() {
        // draw crop area
        this._cropCanvas.drawCropArea(this._image, this.getCenterPoint(), this._size, this._drawArea);
    };

    CropArea.prototype.processMouseMove = function() {};

    CropArea.prototype.processMouseDown = function() {};

    CropArea.prototype.processMouseUp = function() {};

    return CropArea;
}]);

crop.factory('cropCanvas', [function() {
    // Shape = Array of [x,y]; [0, 0] - center
    var shapeArrowNW = [
        [-0.5, -2],
        [-3, -4.5],
        [-0.5, -7],
        [-7, -7],
        [-7, -0.5],
        [-4.5, -3],
        [-2, -0.5]
    ];
    var shapeArrowNE = [
        [0.5, -2],
        [3, -4.5],
        [0.5, -7],
        [7, -7],
        [7, -0.5],
        [4.5, -3],
        [2, -0.5]
    ];
    var shapeArrowSW = [
        [-0.5, 2],
        [-3, 4.5],
        [-0.5, 7],
        [-7, 7],
        [-7, 0.5],
        [-4.5, 3],
        [-2, 0.5]
    ];
    var shapeArrowSE = [
        [0.5, 2],
        [3, 4.5],
        [0.5, 7],
        [7, 7],
        [7, 0.5],
        [4.5, 3],
        [2, 0.5]
    ];
    var shapeArrowN = [
        [-1.5, -2.5],
        [-1.5, -6],
        [-5, -6],
        [0, -11],
        [5, -6],
        [1.5, -6],
        [1.5, -2.5]
    ];
    var shapeArrowW = [
        [-2.5, -1.5],
        [-6, -1.5],
        [-6, -5],
        [-11, 0],
        [-6, 5],
        [-6, 1.5],
        [-2.5, 1.5]
    ];
    var shapeArrowS = [
        [-1.5, 2.5],
        [-1.5, 6],
        [-5, 6],
        [0, 11],
        [5, 6],
        [1.5, 6],
        [1.5, 2.5]
    ];
    var shapeArrowE = [
        [2.5, -1.5],
        [6, -1.5],
        [6, -5],
        [11, 0],
        [6, 5],
        [6, 1.5],
        [2.5, 1.5]
    ];

    // Colors
    var colors = {
        areaOutline: '#fff',
        resizeBoxStroke: '#fff',
        resizeBoxFill: '#444',
        resizeBoxArrowFill: '#fff',
        resizeCircleStroke: '#fff',
        resizeCircleFill: '#444',
        moveIconFill: '#fff'
    };

    return function(ctx) {

        /* Base functions */

        // Calculate Point
        var calcPoint = function(point, offset, scale) {
            return [scale * point[0] + offset[0], scale * point[1] + offset[1]];
        };

        // Draw Filled Polygon
        var drawFilledPolygon = function(shape, fillStyle, centerCoords, scale) {
            ctx.save();
            ctx.fillStyle = fillStyle;
            ctx.beginPath();
            var pc, pc0 = calcPoint(shape[0], centerCoords, scale);
            ctx.moveTo(pc0[0], pc0[1]);

            for (var p in shape) {
                if (p > 0) {
                    pc = calcPoint(shape[p], centerCoords, scale);
                    ctx.lineTo(pc[0], pc[1]);
                }
            }

            ctx.lineTo(pc0[0], pc0[1]);
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        };

        /* Icons */

        this.drawIconMove = function(centerCoords, scale) {
            drawFilledPolygon(shapeArrowN, colors.moveIconFill, centerCoords, scale);
            drawFilledPolygon(shapeArrowW, colors.moveIconFill, centerCoords, scale);
            drawFilledPolygon(shapeArrowS, colors.moveIconFill, centerCoords, scale);
            drawFilledPolygon(shapeArrowE, colors.moveIconFill, centerCoords, scale);
        };

        this.drawIconResizeCircle = function(centerCoords, circleRadius, scale) {
            var scaledCircleRadius = circleRadius * scale;
            ctx.save();
            ctx.strokeStyle = colors.resizeCircleStroke;
            ctx.lineWidth = 2;
            ctx.fillStyle = colors.resizeCircleFill;
            ctx.beginPath();
            ctx.arc(centerCoords[0], centerCoords[1], scaledCircleRadius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            ctx.restore();
        };

        this.drawIconResizeBoxBase = function(centerCoords, boxSize, scale) {
            var scaledBoxSize = boxSize * scale;
            ctx.save();
            ctx.strokeStyle = colors.resizeBoxStroke;
            ctx.lineWidth = 2;
            ctx.fillStyle = colors.resizeBoxFill;
            ctx.fillRect(centerCoords[0] - scaledBoxSize / 2, centerCoords[1] - scaledBoxSize / 2, scaledBoxSize, scaledBoxSize);
            ctx.strokeRect(centerCoords[0] - scaledBoxSize / 2, centerCoords[1] - scaledBoxSize / 2, scaledBoxSize, scaledBoxSize);
            ctx.restore();
        };
        this.drawIconResizeBoxNESW = function(centerCoords, boxSize, scale) {
            this.drawIconResizeBoxBase(centerCoords, boxSize, scale);
            drawFilledPolygon(shapeArrowNE, colors.resizeBoxArrowFill, centerCoords, scale);
            drawFilledPolygon(shapeArrowSW, colors.resizeBoxArrowFill, centerCoords, scale);
        };
        this.drawIconResizeBoxNWSE = function(centerCoords, boxSize, scale) {
            this.drawIconResizeBoxBase(centerCoords, boxSize, scale);
            drawFilledPolygon(shapeArrowNW, colors.resizeBoxArrowFill, centerCoords, scale);
            drawFilledPolygon(shapeArrowSE, colors.resizeBoxArrowFill, centerCoords, scale);
        };

        /* Crop Area */

        this.drawCropArea = function(image, centerCoords, size, fnDrawClipPath) {
            var xRatio = image.width / ctx.canvas.width,
                yRatio = image.height / ctx.canvas.height,
                xLeft = centerCoords.x - size.w / 2,
                yTop = centerCoords.y - size.h / 2;

            ctx.save();
            ctx.strokeStyle = colors.areaOutline;
            ctx.lineWidth = 2;
            ctx.beginPath();
            fnDrawClipPath(ctx, centerCoords, size);
            ctx.stroke();
            ctx.clip();

            // draw part of original image
            if (size.w > 0) {
                ctx.drawImage(image, xLeft * xRatio, yTop * yRatio, size.w * xRatio, size.h * yRatio, xLeft, yTop, size.w, size.h);
            }

            ctx.beginPath();
            fnDrawClipPath(ctx, centerCoords, size);
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
        0x9000: "ExifVersion", // EXIF version
        0xA000: "FlashpixVersion", // Flashpix format version

        // colorspace tags
        0xA001: "ColorSpace", // Color space information tag

        // image configuration
        0xA002: "PixelXDimension", // Valid width of meaningful image
        0xA003: "PixelYDimension", // Valid height of meaningful image
        0x9101: "ComponentsConfiguration", // Information about channels
        0x9102: "CompressedBitsPerPixel", // Compressed bits per pixel

        // user information
        0x927C: "MakerNote", // Any desired information written by the manufacturer
        0x9286: "UserComment", // Comments by user

        // related file
        0xA004: "RelatedSoundFile", // Name of related sound file

        // date and time
        0x9003: "DateTimeOriginal", // Date and time when the original image was generated
        0x9004: "DateTimeDigitized", // Date and time when the image was stored digitally
        0x9290: "SubsecTime", // Fractions of seconds for DateTime
        0x9291: "SubsecTimeOriginal", // Fractions of seconds for DateTimeOriginal
        0x9292: "SubsecTimeDigitized", // Fractions of seconds for DateTimeDigitized

        // picture-taking conditions
        0x829A: "ExposureTime", // Exposure time (in seconds)
        0x829D: "FNumber", // F number
        0x8822: "ExposureProgram", // Exposure program
        0x8824: "SpectralSensitivity", // Spectral sensitivity
        0x8827: "ISOSpeedRatings", // ISO speed rating
        0x8828: "OECF", // Optoelectric conversion factor
        0x9201: "ShutterSpeedValue", // Shutter speed
        0x9202: "ApertureValue", // Lens aperture
        0x9203: "BrightnessValue", // Value of brightness
        0x9204: "ExposureBias", // Exposure bias
        0x9205: "MaxApertureValue", // Smallest F number of lens
        0x9206: "SubjectDistance", // Distance to subject in meters
        0x9207: "MeteringMode", // Metering mode
        0x9208: "LightSource", // Kind of light source
        0x9209: "Flash", // Flash status
        0x9214: "SubjectArea", // Location and area of main subject
        0x920A: "FocalLength", // Focal length of the lens in mm
        0xA20B: "FlashEnergy", // Strobe energy in BCPS
        0xA20C: "SpatialFrequencyResponse", //
        0xA20E: "FocalPlaneXResolution", // Number of pixels in width direction per FocalPlaneResolutionUnit
        0xA20F: "FocalPlaneYResolution", // Number of pixels in height direction per FocalPlaneResolutionUnit
        0xA210: "FocalPlaneResolutionUnit", // Unit for measuring FocalPlaneXResolution and FocalPlaneYResolution
        0xA214: "SubjectLocation", // Location of subject in image
        0xA215: "ExposureIndex", // Exposure index selected on camera
        0xA217: "SensingMethod", // Image sensor type
        0xA300: "FileSource", // Image source (3 == DSC)
        0xA301: "SceneType", // Scene type (1 == directly photographed)
        0xA302: "CFAPattern", // Color filter array geometric pattern
        0xA401: "CustomRendered", // Special processing
        0xA402: "ExposureMode", // Exposure mode
        0xA403: "WhiteBalance", // 1 = auto white balance, 2 = manual
        0xA404: "DigitalZoomRation", // Digital zoom ratio
        0xA405: "FocalLengthIn35mmFilm", // Equivalent foacl length assuming 35mm film camera (in mm)
        0xA406: "SceneCaptureType", // Type of scene
        0xA407: "GainControl", // Degree of overall image gain adjustment
        0xA408: "Contrast", // Direction of contrast processing applied by camera
        0xA409: "Saturation", // Direction of saturation processing applied by camera
        0xA40A: "Sharpness", // Direction of sharpness processing applied by camera
        0xA40B: "DeviceSettingDescription", //
        0xA40C: "SubjectDistanceRange", // Distance to subject

        // other tags
        0xA005: "InteroperabilityIFDPointer",
        0xA420: "ImageUniqueID" // Identifier assigned uniquely to each image
    };

    var TiffTags = this.TiffTags = {
        0x0100: "ImageWidth",
        0x0101: "ImageHeight",
        0x8769: "ExifIFDPointer",
        0x8825: "GPSInfoIFDPointer",
        0xA005: "InteroperabilityIFDPointer",
        0x0102: "BitsPerSample",
        0x0103: "Compression",
        0x0106: "PhotometricInterpretation",
        0x0112: "Orientation",
        0x0115: "SamplesPerPixel",
        0x011C: "PlanarConfiguration",
        0x0212: "YCbCrSubSampling",
        0x0213: "YCbCrPositioning",
        0x011A: "XResolution",
        0x011B: "YResolution",
        0x0128: "ResolutionUnit",
        0x0111: "StripOffsets",
        0x0116: "RowsPerStrip",
        0x0117: "StripByteCounts",
        0x0201: "JPEGInterchangeFormat",
        0x0202: "JPEGInterchangeFormatLength",
        0x012D: "TransferFunction",
        0x013E: "WhitePoint",
        0x013F: "PrimaryChromaticities",
        0x0211: "YCbCrCoefficients",
        0x0214: "ReferenceBlackWhite",
        0x0132: "DateTime",
        0x010E: "ImageDescription",
        0x010F: "Make",
        0x0110: "Model",
        0x0131: "Software",
        0x013B: "Artist",
        0x8298: "Copyright"
    };

    var GPSTags = this.GPSTags = {
        0x0000: "GPSVersionID",
        0x0001: "GPSLatitudeRef",
        0x0002: "GPSLatitude",
        0x0003: "GPSLongitudeRef",
        0x0004: "GPSLongitude",
        0x0005: "GPSAltitudeRef",
        0x0006: "GPSAltitude",
        0x0007: "GPSTimeStamp",
        0x0008: "GPSSatellites",
        0x0009: "GPSStatus",
        0x000A: "GPSMeasureMode",
        0x000B: "GPSDOP",
        0x000C: "GPSSpeedRef",
        0x000D: "GPSSpeed",
        0x000E: "GPSTrackRef",
        0x000F: "GPSTrack",
        0x0010: "GPSImgDirectionRef",
        0x0011: "GPSImgDirection",
        0x0012: "GPSMapDatum",
        0x0013: "GPSDestLatitudeRef",
        0x0014: "GPSDestLatitude",
        0x0015: "GPSDestLongitudeRef",
        0x0016: "GPSDestLongitude",
        0x0017: "GPSDestBearingRef",
        0x0018: "GPSDestBearing",
        0x0019: "GPSDestDistanceRef",
        0x001A: "GPSDestDistance",
        0x001B: "GPSProcessingMethod",
        0x001C: "GPSAreaInformation",
        0x001D: "GPSDateStamp",
        0x001E: "GPSDifferential"
    };

    var StringValues = this.StringValues = {
        ExposureProgram: {
            0: "Not defined",
            1: "Manual",
            2: "Normal program",
            3: "Aperture priority",
            4: "Shutter priority",
            5: "Creative program",
            6: "Action program",
            7: "Portrait mode",
            8: "Landscape mode"
        },
        MeteringMode: {
            0: "Unknown",
            1: "Average",
            2: "CenterWeightedAverage",
            3: "Spot",
            4: "MultiSpot",
            5: "Pattern",
            6: "Partial",
            255: "Other"
        },
        LightSource: {
            0: "Unknown",
            1: "Daylight",
            2: "Fluorescent",
            3: "Tungsten (incandescent light)",
            4: "Flash",
            9: "Fine weather",
            10: "Cloudy weather",
            11: "Shade",
            12: "Daylight fluorescent (D 5700 - 7100K)",
            13: "Day white fluorescent (N 4600 - 5400K)",
            14: "Cool white fluorescent (W 3900 - 4500K)",
            15: "White fluorescent (WW 3200 - 3700K)",
            17: "Standard light A",
            18: "Standard light B",
            19: "Standard light C",
            20: "D55",
            21: "D65",
            22: "D75",
            23: "D50",
            24: "ISO studio tungsten",
            255: "Other"
        },
        Flash: {
            0x0000: "Flash did not fire",
            0x0001: "Flash fired",
            0x0005: "Strobe return light not detected",
            0x0007: "Strobe return light detected",
            0x0009: "Flash fired, compulsory flash mode",
            0x000D: "Flash fired, compulsory flash mode, return light not detected",
            0x000F: "Flash fired, compulsory flash mode, return light detected",
            0x0010: "Flash did not fire, compulsory flash mode",
            0x0018: "Flash did not fire, auto mode",
            0x0019: "Flash fired, auto mode",
            0x001D: "Flash fired, auto mode, return light not detected",
            0x001F: "Flash fired, auto mode, return light detected",
            0x0020: "No flash function",
            0x0041: "Flash fired, red-eye reduction mode",
            0x0045: "Flash fired, red-eye reduction mode, return light not detected",
            0x0047: "Flash fired, red-eye reduction mode, return light detected",
            0x0049: "Flash fired, compulsory flash mode, red-eye reduction mode",
            0x004D: "Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected",
            0x004F: "Flash fired, compulsory flash mode, red-eye reduction mode, return light detected",
            0x0059: "Flash fired, auto mode, red-eye reduction mode",
            0x005D: "Flash fired, auto mode, return light not detected, red-eye reduction mode",
            0x005F: "Flash fired, auto mode, return light detected, red-eye reduction mode"
        },
        SensingMethod: {
            1: "Not defined",
            2: "One-chip color area sensor",
            3: "Two-chip color area sensor",
            4: "Three-chip color area sensor",
            5: "Color sequential area sensor",
            7: "Trilinear sensor",
            8: "Color sequential linear sensor"
        },
        SceneCaptureType: {
            0: "Standard",
            1: "Landscape",
            2: "Portrait",
            3: "Night scene"
        },
        SceneType: {
            1: "Directly photographed"
        },
        CustomRendered: {
            0: "Normal process",
            1: "Custom process"
        },
        WhiteBalance: {
            0: "Auto white balance",
            1: "Manual white balance"
        },
        GainControl: {
            0: "None",
            1: "Low gain up",
            2: "High gain up",
            3: "Low gain down",
            4: "High gain down"
        },
        Contrast: {
            0: "Normal",
            1: "Soft",
            2: "Hard"
        },
        Saturation: {
            0: "Normal",
            1: "Low saturation",
            2: "High saturation"
        },
        Sharpness: {
            0: "Normal",
            1: "Soft",
            2: "Hard"
        },
        SubjectDistanceRange: {
            0: "Unknown",
            1: "Macro",
            2: "Close view",
            3: "Distant view"
        },
        FileSource: {
            3: "DSC"
        },

        Components: {
            0: "",
            1: "Y",
            2: "Cb",
            3: "Cr",
            4: "R",
            5: "G",
            6: "B"
        }
    };

    function addEvent(element, event, handler) {
        if (element.addEventListener) {
            element.addEventListener(event, handler, false);
        } else if (element.attachEvent) {
            element.attachEvent("on" + event, handler);
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
        http.open("GET", url, true);
        http.responseType = "blob";
        http.onload = function(e) {
            if (this.status == 200 || this.status === 0) {
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
                objectURLToBlob(img.src, function(blob) {
                    fileReader.readAsArrayBuffer(blob);
                });
            } else {
                var http = new XMLHttpRequest();
                http.onload = function() {
                    if (this.status == 200 || this.status === 0) {
                        handleBinaryFile(http.response);
                    } else {
                        throw "Could not load image";
                    }
                    http = null;
                };
                http.open("GET", img.src, true);
                http.responseType = "arraybuffer";
                http.send(null);
            }
        } else if (window.FileReader && (img instanceof window.Blob || img instanceof window.File)) {
            var fileReader = new FileReader();
            fileReader.onload = function(e) {
                if (debug) console.log("Got file of length " + e.target.result.byteLength);
                handleBinaryFile(e.target.result);
            };

            fileReader.readAsArrayBuffer(img);
        }
    }

    function findEXIFinJPEG(file) {
        var dataView = new DataView(file);

        if (debug) console.log("Got file of length " + file.byteLength);
        if ((dataView.getUint8(0) != 0xFF) || (dataView.getUint8(1) != 0xD8)) {
            if (debug) console.log("Not a valid JPEG");
            return false; // not a valid jpeg
        }

        var offset = 2,
            length = file.byteLength,
            marker;

        while (offset < length) {
            if (dataView.getUint8(offset) != 0xFF) {
                if (debug) console.log("Not a valid marker at offset " + offset + ", found: " + dataView.getUint8(offset));
                return false; // not a valid marker, something is wrong
            }

            marker = dataView.getUint8(offset + 1);
            if (debug) console.log(marker);

            // we could implement handling for other markers here,
            // but we're only looking for 0xFFE1 for EXIF data

            if (marker == 225) {
                if (debug) console.log("Found 0xFFE1 marker");

                return readEXIFData(dataView, offset + 4, dataView.getUint16(offset + 2) - 2);

                // offset += 2 + file.getShortAt(offset+2, true);

            } else {
                offset += 2 + dataView.getUint16(offset + 2);
            }

        }

    }

    function findIPTCinJPEG(file) {
        var dataView = new DataView(file);

        if (debug) console.log("Got file of length " + file.byteLength);
        if ((dataView.getUint8(0) != 0xFF) || (dataView.getUint8(1) != 0xD8)) {
            if (debug) console.log("Not a valid JPEG");
            return false; // not a valid jpeg
        }

        var offset = 2,
            length = file.byteLength;

        var isFieldSegmentStart = function(dataView, offset) {
            return (
                dataView.getUint8(offset) === 0x38 &&
                dataView.getUint8(offset + 1) === 0x42 &&
                dataView.getUint8(offset + 2) === 0x49 &&
                dataView.getUint8(offset + 3) === 0x4D &&
                dataView.getUint8(offset + 4) === 0x04 &&
                dataView.getUint8(offset + 5) === 0x04
            );
        };

        while (offset < length) {

            if (isFieldSegmentStart(dataView, offset)) {

                // Get the length of the name header (which is padded to an even number of bytes)
                var nameHeaderLength = dataView.getUint8(offset + 7);
                if (nameHeaderLength % 2 !== 0) nameHeaderLength += 1;
                // Check for pre photoshop 6 format
                if (nameHeaderLength === 0) {
                    // Always 4
                    nameHeaderLength = 4;
                }

                var startOffset = offset + 8 + nameHeaderLength;
                var sectionLength = dataView.getUint16(offset + 6 + nameHeaderLength);

                return readIPTCData(file, startOffset, sectionLength);

                break;

            }

            // Not the marker, continue searching
            offset++;

        }

    }
    var IptcFieldMap = {
        0x78: 'caption',
        0x6E: 'credit',
        0x19: 'keywords',
        0x37: 'dateCreated',
        0x50: 'byline',
        0x55: 'bylineTitle',
        0x7A: 'captionWriter',
        0x69: 'headline',
        0x74: 'copyright',
        0x0F: 'category'
    };

    function readIPTCData(file, startOffset, sectionLength) {
        var dataView = new DataView(file);
        var data = {};
        var fieldValue, fieldName, dataSize, segmentType, segmentSize;
        var segmentStartPos = startOffset;
        while (segmentStartPos < startOffset + sectionLength) {
            if (dataView.getUint8(segmentStartPos) === 0x1C && dataView.getUint8(segmentStartPos + 1) === 0x02) {
                segmentType = dataView.getUint8(segmentStartPos + 2);
                if (segmentType in IptcFieldMap) {
                    dataSize = dataView.getInt16(segmentStartPos + 3);
                    segmentSize = dataSize + 5;
                    fieldName = IptcFieldMap[segmentType];
                    fieldValue = getStringFromDB(dataView, segmentStartPos + 5, dataSize);
                    // Check if we already stored a value with this name
                    if (data.hasOwnProperty(fieldName)) {
                        // Value already stored with this name, create multivalue field
                        if (data[fieldName] instanceof Array) {
                            data[fieldName].push(fieldValue);
                        } else {
                            data[fieldName] = [data[fieldName], fieldValue];
                        }
                    } else {
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

        for (i = 0; i < entries; i++) {
            entryOffset = dirStart + i * 12 + 2;
            tag = strings[file.getUint16(entryOffset, !bigEnd)];
            if (!tag && debug) console.log("Unknown tag: " + file.getUint16(entryOffset, !bigEnd));
            tags[tag] = readTagValue(file, entryOffset, tiffStart, dirStart, bigEnd);
        }
        return tags;
    }

    function readTagValue(file, entryOffset, tiffStart, dirStart, bigEnd) {
        var type = file.getUint16(entryOffset + 2, !bigEnd),
            numValues = file.getUint32(entryOffset + 4, !bigEnd),
            valueOffset = file.getUint32(entryOffset + 8, !bigEnd) + tiffStart,
            offset,
            vals, val, n,
            numerator, denominator;

        switch (type) {
            case 1: // byte, 8-bit unsigned int
            case 7: // undefined, 8-bit byte, value depending on field
                if (numValues == 1) {
                    return file.getUint8(entryOffset + 8, !bigEnd);
                } else {
                    offset = numValues > 4 ? valueOffset : (entryOffset + 8);
                    vals = [];
                    for (n = 0; n < numValues; n++) {
                        vals[n] = file.getUint8(offset + n);
                    }
                    return vals;
                }

            case 2: // ascii, 8-bit byte
                offset = numValues > 4 ? valueOffset : (entryOffset + 8);
                return getStringFromDB(file, offset, numValues - 1);

            case 3: // short, 16 bit int
                if (numValues == 1) {
                    return file.getUint16(entryOffset + 8, !bigEnd);
                } else {
                    offset = numValues > 2 ? valueOffset : (entryOffset + 8);
                    vals = [];
                    for (n = 0; n < numValues; n++) {
                        vals[n] = file.getUint16(offset + 2 * n, !bigEnd);
                    }
                    return vals;
                }

            case 4: // long, 32 bit int
                if (numValues == 1) {
                    return file.getUint32(entryOffset + 8, !bigEnd);
                } else {
                    vals = [];
                    for (n = 0; n < numValues; n++) {
                        vals[n] = file.getUint32(valueOffset + 4 * n, !bigEnd);
                    }
                    return vals;
                }

            case 5: // rational = two long values, first is numerator, second is denominator
                if (numValues == 1) {
                    numerator = file.getUint32(valueOffset, !bigEnd);
                    denominator = file.getUint32(valueOffset + 4, !bigEnd);
                    val = new Number(numerator / denominator);
                    val.numerator = numerator;
                    val.denominator = denominator;
                    return val;
                } else {
                    vals = [];
                    for (n = 0; n < numValues; n++) {
                        numerator = file.getUint32(valueOffset + 8 * n, !bigEnd);
                        denominator = file.getUint32(valueOffset + 4 + 8 * n, !bigEnd);
                        vals[n] = new Number(numerator / denominator);
                        vals[n].numerator = numerator;
                        vals[n].denominator = denominator;
                    }
                    return vals;
                }

            case 9: // slong, 32 bit signed int
                if (numValues == 1) {
                    return file.getInt32(entryOffset + 8, !bigEnd);
                } else {
                    vals = [];
                    for (n = 0; n < numValues; n++) {
                        vals[n] = file.getInt32(valueOffset + 4 * n, !bigEnd);
                    }
                    return vals;
                }

            case 10: // signed rational, two slongs, first is numerator, second is denominator
                if (numValues == 1) {
                    return file.getInt32(valueOffset, !bigEnd) / file.getInt32(valueOffset + 4, !bigEnd);
                } else {
                    vals = [];
                    for (n = 0; n < numValues; n++) {
                        vals[n] = file.getInt32(valueOffset + 8 * n, !bigEnd) / file.getInt32(valueOffset + 4 + 8 * n, !bigEnd);
                    }
                    return vals;
                }
        }
    }

    function getStringFromDB(buffer, start, length) {
        var outstr = "";
        for (var n = start; n < start + length; n++) {
            outstr += String.fromCharCode(buffer.getUint8(n));
        }
        return outstr;
    }

    function readEXIFData(file, start) {
        if (getStringFromDB(file, start, 4) != "Exif") {
            if (debug) console.log("Not valid EXIF data! " + getStringFromDB(file, start, 4));
            return false;
        }

        var bigEnd,
            tags, tag,
            exifData, gpsData,
            tiffOffset = start + 6;

        // test for TIFF validity and endianness
        if (file.getUint16(tiffOffset) == 0x4949) {
            bigEnd = false;
        } else if (file.getUint16(tiffOffset) == 0x4D4D) {
            bigEnd = true;
        } else {
            if (debug) console.log("Not valid TIFF data! (no 0x4949 or 0x4D4D)");
            return false;
        }

        if (file.getUint16(tiffOffset + 2, !bigEnd) != 0x002A) {
            if (debug) console.log("Not valid TIFF data! (no 0x002A)");
            return false;
        }

        var firstIFDOffset = file.getUint32(tiffOffset + 4, !bigEnd);

        if (firstIFDOffset < 0x00000008) {
            if (debug) console.log("Not valid TIFF data! (First offset less than 8)", file.getUint32(tiffOffset + 4, !bigEnd));
            return false;
        }

        tags = readTags(file, tiffOffset, tiffOffset + firstIFDOffset, TiffTags, bigEnd);

        if (tags.ExifIFDPointer) {
            exifData = readTags(file, tiffOffset, tiffOffset + tags.ExifIFDPointer, ExifTags, bigEnd);
            for (tag in exifData) {
                switch (tag) {
                    case "LightSource":
                    case "Flash":
                    case "MeteringMode":
                    case "ExposureProgram":
                    case "SensingMethod":
                    case "SceneCaptureType":
                    case "SceneType":
                    case "CustomRendered":
                    case "WhiteBalance":
                    case "GainControl":
                    case "Contrast":
                    case "Saturation":
                    case "Sharpness":
                    case "SubjectDistanceRange":
                    case "FileSource":
                        exifData[tag] = StringValues[tag][exifData[tag]];
                        break;

                    case "ExifVersion":
                    case "FlashpixVersion":
                        exifData[tag] = String.fromCharCode(exifData[tag][0], exifData[tag][1], exifData[tag][2], exifData[tag][3]);
                        break;

                    case "ComponentsConfiguration":
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
                    case "GPSVersionID":
                        gpsData[tag] = gpsData[tag][0] +
                            "." + gpsData[tag][1] +
                            "." + gpsData[tag][2] +
                            "." + gpsData[tag][3];
                        break;
                }
                tags[tag] = gpsData[tag];
            }
        }

        return tags;
    }

    this.getData = function(img, callback) {
        if ((img instanceof Image || img instanceof HTMLImageElement) && !img.complete) return false;

        if (!imageHasData(img)) {
            getImageData(img, callback);
        } else {
            if (callback) {
                callback.call(img);
            }
        }
        return true;
    }

    this.getTag = function(img, tag) {
        if (!imageHasData(img)) return;
        return img.exifdata[tag];
    }

    this.getAllTags = function(img) {
        if (!imageHasData(img)) return {};
        var a,
            data = img.exifdata,
            tags = {};
        for (a in data) {
            if (data.hasOwnProperty(a)) {
                tags[a] = data[a];
            }
        }
        return tags;
    }

    this.pretty = function(img) {
        if (!imageHasData(img)) return "";
        var a,
            data = img.exifdata,
            strPretty = "";
        for (a in data) {
            if (data.hasOwnProperty(a)) {
                if (typeof data[a] == "object") {
                    if (data[a] instanceof Number) {
                        strPretty += a + " : " + data[a] + " [" + data[a].numerator + "/" + data[a].denominator + "]\r\n";
                    } else {
                        strPretty += a + " : [" + data[a].length + " values]\r\n";
                    }
                } else {
                    strPretty += a + " : " + data[a] + "\r\n";
                }
            }
        }
        return strPretty;
    }

    this.readFromBinaryFile = function(file) {
        return findEXIFinJPEG(file);
    }
}]);

crop.factory('cropHost', ['$document', '$q', 'cropAreaCircle', 'cropAreaSquare', 'cropAreaRectangle', 'cropEXIF', function($document, $q, CropAreaCircle, CropAreaSquare, CropAreaRectangle, cropEXIF) {
    /* STATIC FUNCTIONS */

    // Get Element's Offset
    var getElementOffset = function(elem) {
        var box = elem.getBoundingClientRect();

        var body = document.body;
        var docElem = document.documentElement;

        var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
        var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;

        var clientTop = docElem.clientTop || body.clientTop || 0;
        var clientLeft = docElem.clientLeft || body.clientLeft || 0;

        var top = box.top + scrollTop - clientTop;
        var left = box.left + scrollLeft - clientLeft;

        var colorPaletteLength = 8;

        return {
            top: Math.round(top),
            left: Math.round(left)
        };
    };

    return function(elCanvas, opts, events) {
        /* PRIVATE VARIABLES */

        // Object Pointers
        var ctx = null,
            image = null,
            theArea = null,
            self = this,

            // Dimensions
            minCanvasDims = [100, 100],
            maxCanvasDims = [300, 300],

            // Result Image size
            resImgSizeArray = [],
            resImgSize = {
                w: 200,
                h: 200
            },

            // Result Image type
            resImgFormat = 'image/png',

            // Result Image quality
            resImgQuality = null,

            forceAspectRatio = false;

        /* PRIVATE FUNCTIONS */

        // Draw Scene
        function drawScene() {
            // clear canvas
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            if (image !== null) {
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
        var resetCropHost = function() {
            if (image !== null) {
                theArea.setImage(image);
                var imageDims = [image.width, image.height],
                    imageRatio = image.width / image.height,
                    canvasDims = imageDims;

                if (canvasDims[0] > maxCanvasDims[0]) {
                    canvasDims[0] = maxCanvasDims[0];
                    canvasDims[1] = canvasDims[0] / imageRatio;
                } else if (canvasDims[0] < minCanvasDims[0]) {
                    canvasDims[0] = minCanvasDims[0];
                    canvasDims[1] = canvasDims[0] / imageRatio;
                }
                if (canvasDims[1] > maxCanvasDims[1]) {
                    canvasDims[1] = maxCanvasDims[1];
                    canvasDims[0] = canvasDims[1] * imageRatio;
                } else if (canvasDims[1] < minCanvasDims[1]) {
                    canvasDims[1] = minCanvasDims[1];
                    canvasDims[0] = canvasDims[1] * imageRatio;
                }
                elCanvas.prop('width', canvasDims[0]).prop('height', canvasDims[1]).css({
                    'margin-left': -canvasDims[0] / 2 + 'px',
                    'margin-top': -canvasDims[1] / 2 + 'px'
                });

                var cw = ctx.canvas.width;
                var ch = ctx.canvas.height;

                var areaType = self.getAreaType();
                // enforce 1:1 aspect ratio for square-like selections
                if ((areaType === 'circle') || (areaType === 'square')) {
                    ch = cw;
                }

                theArea.setSize({
                    w: Math.min(200, cw / 2),
                    h: Math.min(200, ch / 2)
                });
                //TODO: set top left corner point
                theArea.setCenterPoint({
                    x: ctx.canvas.width / 2,
                    y: ctx.canvas.height / 2
                });

            } else {
                elCanvas.prop('width', 0).prop('height', 0).css({
                    'margin-top': 0
                });
            }

            drawScene();
        };

        var getChangedTouches = function(event) {
            if (angular.isDefined(event.changedTouches)) {
                return event.changedTouches;
            } else {
                return event.originalEvent.changedTouches;
            }
        };

        var onMouseMove = function(e) {
            if (image !== null) {
                var offset = getElementOffset(ctx.canvas),
                    pageX, pageY;
                if (e.type === 'touchmove') {
                    pageX = getChangedTouches(e)[0].pageX;
                    pageY = getChangedTouches(e)[0].pageY;
                } else {
                    pageX = e.pageX;
                    pageY = e.pageY;
                }
                theArea.processMouseMove(pageX - offset.left, pageY - offset.top);
                drawScene();
            }
        };

        var onMouseDown = function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (image !== null) {
                var offset = getElementOffset(ctx.canvas),
                    pageX, pageY;
                if (e.type === 'touchstart') {
                    pageX = getChangedTouches(e)[0].pageX;
                    pageY = getChangedTouches(e)[0].pageY;
                } else {
                    pageX = e.pageX;
                    pageY = e.pageY;
                }
                theArea.processMouseDown(pageX - offset.left, pageY - offset.top);
                drawScene();
            }
        };

        var onMouseUp = function(e) {
            if (image !== null) {
                var offset = getElementOffset(ctx.canvas),
                    pageX, pageY;
                if (e.type === 'touchend') {
                    pageX = getChangedTouches(e)[0].pageX;
                    pageY = getChangedTouches(e)[0].pageY;
                } else {
                    pageX = e.pageX;
                    pageY = e.pageY;
                }
                theArea.processMouseUp(pageX - offset.left, pageY - offset.top);
                drawScene();
            }
        };

        var renderImageToDataURL = function(getResultImageSize){
            var temp_ctx, temp_canvas,
                ris = getResultImageSize,
                center = theArea.getCenterPoint(),
                retObj = {
                    dataURI: null,
                    imageData: null
                };
            temp_canvas = angular.element('<canvas></canvas>')[0];
            temp_ctx = temp_canvas.getContext('2d');
            temp_canvas.width = ris.w;
            temp_canvas.height = ris.h;
            if (image !== null) {
                var x = (center.x - theArea.getSize().w / 2) * (image.width / ctx.canvas.width),
                    y = (center.y - theArea.getSize().h / 2) * (image.height / ctx.canvas.height),
                    areaWidth = theArea.getSize().w * (image.width / ctx.canvas.width),
                    areaHeight = theArea.getSize().h * (image.height / ctx.canvas.height);

                if (forceAspectRatio) {
                    temp_ctx.drawImage(image, x, y,
                        areaWidth,
                        areaHeight,
                        0,
                        0,
                        ris.w,
                        ris.h);
                } else {
                    var aspectRatio = areaWidth / areaHeight;
                    var resultHeight, resultWidth;

                    if (aspectRatio > 1) {
                        resultWidth = ris.w;
                        resultHeight = resultWidth / aspectRatio;
                    } else {
                        resultHeight = ris.h;
                        resultWidth = resultHeight * aspectRatio;
                    }

                    temp_ctx.drawImage(image,
                        x,
                        y,
                        areaWidth,
                        areaHeight,
                        0,
                        0,
                        Math.round(resultWidth),
                        Math.round(resultHeight));
                }

                if (resImgQuality !== null) {
                    retObj.dataURI = temp_canvas.toDataURL(resImgFormat, resImgQuality);
                } else {
                    retObj.dataURI = temp_canvas.toDataURL(resImgFormat);
                }
            }
            return retObj;
        }

        this.getResultImage = function() {
            if(resImgSizeArray.length==0){
                return renderImageToDataURL(this.getResultImageSize());
            }else{
                var arrayResultImages=[];
                for (var i = 0; i < resImgSizeArray.length; i++) {
                    arrayResultImages.push({
                        dataURI:renderImageToDataURL(resImgSizeArray[i]).dataURI,
                        w:resImgSizeArray[i].w,
                        h:resImgSizeArray[i].h
                    });
                };
                return arrayResultImages;
            }
        };

        this.getResultImageDataBlob = function() {
            var temp_ctx, temp_canvas, _p,
                center = theArea.getCenterPoint(),
                ris = this.getResultImageSize(),
                _p = $q.defer();
            temp_canvas = angular.element('<canvas></canvas>')[0];
            temp_ctx = temp_canvas.getContext('2d');
            temp_canvas.width = ris.w;
            temp_canvas.height = ris.h;
            if (image !== null) {
                var x = (center.x - theArea.getSize().w / 2) * (image.width / ctx.canvas.width),
                    y = (center.y - theArea.getSize().h / 2) * (image.height / ctx.canvas.height),
                    areaWidth = theArea.getSize().w * (image.width / ctx.canvas.width),
                    areaHeight = theArea.getSize().h * (image.height / ctx.canvas.height);

                if (forceAspectRatio) {
                    temp_ctx.drawImage(image, x, y,
                        areaWidth,
                        areaHeight,
                        0,
                        0,
                        ris.w,
                        ris.h);
                } else {
                    var aspectRatio = areaWidth / areaHeight;
                    var resultHeight, resultWidth;

                    if (aspectRatio > 1) {
                        resultWidth = ris.w;
                        resultHeight = resultWidth / aspectRatio;
                    } else {
                        resultHeight = ris.h;
                        resultWidth = resultHeight * aspectRatio;
                    }

                    temp_ctx.drawImage(image,
                        x,
                        y,
                        areaWidth,
                        areaHeight,
                        0,
                        0,
                        Math.round(resultWidth),
                        Math.round(resultHeight));
                }
            }
            temp_canvas.toBlob(function(blob) {
                _p.resolve(blob);
            }, resImgFormat);
            return _p.promise;
        };

        this.getAreaCoords = function() {
            return theArea.getSize()
        }

        this.setNewImageSource = function(imageSource) {
            image = null;
            resetCropHost();
            events.trigger('image-updated');
            if (!!imageSource) {
                var newImage = new Image();
                newImage.crossOrigin = 'anonymous';
                newImage.onload = function() {
                    events.trigger('load-done');

                    cropEXIF.getData(newImage, function() {
                        var orientation = cropEXIF.getTag(newImage, 'Orientation');

                        if ([3, 6, 8].indexOf(orientation) > -1) {
                            var canvas = document.createElement("canvas"),
                                ctx = canvas.getContext("2d"),
                                cw = newImage.width,
                                ch = newImage.height,
                                cx = 0,
                                cy = 0,
                                deg = 0,
                                rw = 0,
                                rh = 0;
                            rw = cw;
                            rh = ch;
                            switch (orientation) {
                                case 3:
                                    cx = -newImage.width;
                                    cy = -newImage.height;
                                    deg = 180;
                                    break;
                                case 6:
                                    cw = newImage.height;
                                    ch = newImage.width;
                                    cy = -newImage.height;
                                    deg = 90;
                                    break;
                                case 8:
                                    cw = newImage.height;
                                    ch = newImage.width;
                                    cx = -newImage.width;
                                    deg = 270;
                                    break;
                            }

                            //// canvas.toDataURL will only work if the canvas isn't too large. Resize to 1000px.
                            var maxWorH = 1000;
                            if (cw > maxWorH || ch > maxWorH) {
                                var p = 0;
                                if (cw > maxWorH) {
                                    p = (maxWorH) / cw;
                                    cw = maxWorH;
                                    ch = p * ch;
                                } else if (ch > maxWorH) {
                                    p = (maxWorH) / ch;
                                    ch = maxWorH;
                                    cw = p * cw;
                                }

                                cy = p * cy;
                                cx = p * cx;
                                rw = p * rw;
                                rh = p * rh;
                            }

                            canvas.width = cw;
                            canvas.height = ch;
                            ctx.rotate(deg * Math.PI / 180);
                            ctx.drawImage(newImage, cx, cy, rw, rh);

                            image = new Image();
                            image.src = canvas.toDataURL(resImgFormat);
                        } else {
                            image = newImage;
                        }
                        resetCropHost();
                        events.trigger('image-updated');
                    });
                };
                newImage.onerror = function() {
                    events.trigger('load-error');
                };
                events.trigger('load-start');
                if (imageSource instanceof window.Blob) {
                    newImage.src = URL.createObjectURL(imageSource);
                } else {
                    newImage.src = imageSource;
                }
            }
        };

        this.setMaxDimensions = function(width, height) {
            maxCanvasDims = [width, height];

            if (image !== null) {
                var curWidth = ctx.canvas.width,
                    curHeight = ctx.canvas.height;

                var imageDims = [image.width, image.height],
                    imageRatio = image.width / image.height,
                    canvasDims = imageDims;

                if (canvasDims[0] > maxCanvasDims[0]) {
                    canvasDims[0] = maxCanvasDims[0];
                    canvasDims[1] = canvasDims[0] / imageRatio;
                } else if (canvasDims[0] < minCanvasDims[0]) {
                    canvasDims[0] = minCanvasDims[0];
                    canvasDims[1] = canvasDims[0] / imageRatio;
                }
                if (canvasDims[1] > maxCanvasDims[1]) {
                    canvasDims[1] = maxCanvasDims[1];
                    canvasDims[0] = canvasDims[1] * imageRatio;
                } else if (canvasDims[1] < minCanvasDims[1]) {
                    canvasDims[1] = minCanvasDims[1];
                    canvasDims[0] = canvasDims[1] * imageRatio;
                }
                elCanvas.prop('width', canvasDims[0]).prop('height', canvasDims[1]).css({
                    'margin-left': -canvasDims[0] / 2 + 'px',
                    'margin-top': -canvasDims[1] / 2 + 'px'
                });

                var ratioNewCurWidth = ctx.canvas.width / curWidth,
                    ratioNewCurHeight = ctx.canvas.height / curHeight,
                    ratioMin = Math.min(ratioNewCurWidth, ratioNewCurHeight);

                //TODO: use top left corner point
                theArea.setSize({
                    w: theArea.getSize().w * ratioMin,
                    h: theArea.getSize().h * ratioMin
                });
                var center = theArea.getCenterPoint();
                theArea.setCenterPoint({
                    x: center.x * ratioNewCurWidth,
                    y: center.y * ratioNewCurHeight
                });

            } else {
                elCanvas.prop('width', 0).prop('height', 0).css({
                    'margin-top': 0
                });
            }

            drawScene();

        };

        this.setAreaMinSize = function(size) {
            if (angular.isUndefined(size)) {
                return;
            }else if(typeof size == 'number' || typeof size == 'string'){
                size = {
                    w: parseInt(parseInt(size), 10),
                    h: parseInt(parseInt(size), 10)
                };
            }else{
                size = {
                    w: parseInt(size.w, 10),
                    h: parseInt(size.h, 10)
                };
            }
            if (!isNaN(size.w) && !isNaN(size.h)) {
                theArea.setMinSize(size);
                drawScene();
            }
        };

        this.getResultImageSize = function() {
            if (resImgSize == "selection") {
                return theArea.getSize();
            }else if(resImgSize == "max") {
                 // We maximize the rendered size
                var zoom = 1;
                if (image && ctx && ctx.canvas) {
                    zoom = image.width / ctx.canvas.width;
                }
                var size = {
                    w: zoom * theArea.getSize().w,
                    h: zoom * theArea.getSize().h
                };
                return size;
            }

            return resImgSize;
        };
        this.setResultImageSize = function(size) {
            if(angular.isArray(size)){
                resImgSizeArray=size.slice();
                size = {
                    w: parseInt(size[0].w, 10),
                    h: parseInt(size[0].h, 10)
                };
                return;
            }
            if (angular.isUndefined(size)) {
                return;
            }
            //allow setting of size to "selection" for mirroring selection's dimensions
            if (angular.isString(size)) {
                resImgSize = size;
                return;
            }
            //allow scalar values for square-like selection shapes
            if (angular.isNumber(size)) {
                size = parseInt(size, 10);
                size = {
                    w: size,
                    h: size
                };
            }
            size = {
                w: parseInt(size.w, 10),
                h: parseInt(size.h, 10)
            };
            if (!isNaN(size.w) && !isNaN(size.h)) {
                resImgSize = size;
                drawScene();
            }
        };

        this.setResultImageFormat = function(format) {
            resImgFormat = format;
        };

        this.setResultImageQuality = function(quality) {
            quality = parseFloat(quality);
            if (!isNaN(quality) && quality >= 0 && quality <= 1) {
                resImgQuality = quality;
            }
        };

        // returns a string of the selection area's type
        this.getAreaType = function() {
            return theArea.getType();
        }

        this.setAreaType = function(type) {
            var center = theArea.getCenterPoint();
            var curSize = theArea.getSize(),
                curMinSize = theArea.getMinSize(),
                curX = center.x,
                curY = center.y;

            var AreaClass = CropAreaCircle;
            if (type === 'square') {
                AreaClass = CropAreaSquare;
            } else if (type === 'rectangle') {
                AreaClass = CropAreaRectangle;
            }
            theArea = new AreaClass(ctx, events);
            theArea.setMinSize(curMinSize);
            theArea.setSize(curSize);
            if (type === 'square' || type === 'circle') {
                forceAspectRatio = true;
                theArea.setForceAspectRatio(true);
            }else{
                forceAspectRatio = false;
                theArea.setForceAspectRatio(false);
            }

            //TODO: use top left point
            theArea.setCenterPoint({
                x: curX,
                y: curY
            });

            // resetCropHost();
            if (image !== null) {
                theArea.setImage(image);
            }

            drawScene();
        };

        this.getDominantColor = function(uri) {
            var imageDC = new Image(),
                colorThief = new ColorThief(),
                dominantColor = null,
                _p = $q.defer();
            imageDC.src = uri;
            imageDC.onload = function() {
                dominantColor = colorThief.getColor(imageDC);
                _p.resolve(dominantColor);
            };

            return _p.promise;
        };

        this.getPalette = function(uri) {
            var imageDC = new Image(),
                colorThief = new ColorThief(),
                palette = null,
                _p = $q.defer();
            imageDC.src = uri;
            imageDC.onload = function() {
                palette = colorThief.getPalette(imageDC, colorPaletteLength);
                _p.resolve(palette);
            };

            return _p.promise;
        };

        this.setPaletteColorLength = function(lg) {
            colorPaletteLength = lg;
        };

        this.setAspect = function(aspect) {
            theArea.setAspect(aspect);
            var minSize = theArea.getMinSize();
            minSize.w=minSize.h*aspect;
            theArea.setMinSize(minSize);
            var size = theArea.getSize();
            size.w=size.h*aspect;
            theArea.setSize(size);
        };

        /* Life Cycle begins */

        // Init Context var
        ctx = elCanvas[0].getContext('2d');

        // Init CropArea
        theArea = new CropAreaCircle(ctx, events);

        // Init Mouse Event Listeners
        $document.on('mousemove', onMouseMove);
        elCanvas.on('mousedown', onMouseDown);
        $document.on('mouseup', onMouseUp);

        // Init Touch Event Listeners
        $document.on('touchmove', onMouseMove);
        elCanvas.on('touchstart', onMouseDown);
        $document.on('touchend', onMouseUp);

        // CropHost Destructor
        this.destroy = function() {
            $document.off('mousemove', onMouseMove);
            elCanvas.off('mousedown', onMouseDown);
            $document.off('mouseup', onMouseMove);

            $document.off('touchmove', onMouseMove);
            elCanvas.off('touchstart', onMouseDown);
            $document.off('touchend', onMouseMove);

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
            resultArrayImage: '=?',
            resultBlob: '=?',
            urlBlob: '=?',
            chargement: '=?',
            
            changeOnFly: '=?',
            areaCoords: '=?',
            areaType: '@',
            areaMinSize: '=?',
            resultImageSize: '=?',
            resultImageFormat: '=?',
            resultImageQuality: '=?',

            aspectRatio: '=?',
            
            dominantColor: '=?',
            paletteColor: '=?',
            paletteColorLength: '=?',

            onChange: '&',
            onLoadBegin: '&',
            onLoadDone: '&',
            onLoadError: '&'
        },
        template: '<canvas></canvas>',
        controller: ['$scope', function($scope) {
            $scope.events = new CropPubSub();
        }],
        link: function(scope, element /*, attrs*/ ) {
            // Init Events Manager
            var events = scope.events;

            // Init Crop Host
            var cropHost = new CropHost(element.find('canvas'), {}, events);

            // Store Result Image to check if it's changed
            var storedResultImage;

            var updateResultImage = function(scope) {
                if (scope.image !== '') {
                    var resultImageObj = cropHost.getResultImage();
                    if(angular.isArray(resultImageObj)){
                        resultImage=resultImageObj[0].dataURI;
                        scope.resultArrayImage=resultImageObj;
                        console.log(scope.resultArrayImage);
                    }else var resultImage = resultImageObj.dataURI;
                    var urlCreator = window.URL || window.webkitURL;
                    if (storedResultImage !== resultImage) {
                        storedResultImage = resultImage;
                        scope.resultImage = resultImage;

                        cropHost.getResultImageDataBlob().then(function(blob) {
                            scope.resultBlob = blob;
                            scope.urlBlob = urlCreator.createObjectURL(blob);
                        });

                        if (scope.resultImage) {
                            cropHost.getDominantColor(scope.resultImage).then(function(dominantColor) {
                                scope.dominantColor = dominantColor;
                            });
                            cropHost.getPalette(scope.resultImage).then(function(palette) {
                                scope.paletteColor = palette;
                            });
                        }

                        updateAreaCoords(scope);
                        scope.onChange({
                            $dataURI: scope.resultImage
                        });
                    }
                }
            };

            var updateAreaCoords = function(scope) {
                var areaCoords = cropHost.getAreaCoords();
                scope.areaCoords = areaCoords;
            }

            // Wrapper to safely exec functions within $apply on a running $digest cycle
            var fnSafeApply = function(fn) {
                return function() {
                    $timeout(function() {
                        scope.$apply(function(scope) {
                            fn(scope);
                        });
                    });
                };
            };

            if(scope.chargement==null) scope.chargement='Chargement';
            var displayLoading = function() {
                element.append('<div class="loading"><span>'+scope.chargement+'...</span></div>')
            };

            // Setup CropHost Event Handlers
            events
                .on('load-start', fnSafeApply(function(scope) {
                    scope.onLoadBegin({});
                }))
                .on('load-done', fnSafeApply(function(scope) {
                    angular.element(element.children()[element.children().length-1]).remove();
                    scope.onLoadDone({});
                }))
                .on('load-error', fnSafeApply(function(scope) {
                    scope.onLoadError({});
                }))
                .on('area-move area-resize', fnSafeApply(function(scope) {
                    if (!!scope.changeOnFly) {
                        updateResultImage(scope);
                    }
                }))
                .on('area-move-end area-resize-end image-updated', fnSafeApply(function(scope) {
                    updateResultImage(scope);
                }));

            // Sync CropHost with Directive's options
            scope.$watch('image', function(newVal) {
                if(newVal) {
                    displayLoading();
                }
                $timeout(function() {
                    cropHost.setNewImageSource(scope.image);
                }, 100);
            });
            scope.$watch('areaType', function() {
                cropHost.setAreaType(scope.areaType);
                updateResultImage(scope);
            });
            scope.$watch('areaMinSize', function() {
                cropHost.setAreaMinSize(scope.areaMinSize);
                updateResultImage(scope);
            });
            scope.$watch('resultImageFormat',function(){
                cropHost.setResultImageFormat(scope.resultImageFormat);
                updateResultImage(scope);
            });
            scope.$watch('resultImageQuality',function(){
                cropHost.setResultImageQuality(scope.resultImageQuality);
                updateResultImage(scope);
            });
            scope.$watch('resultImageSize', function() {
                cropHost.setResultImageSize(scope.resultImageSize);
                updateResultImage(scope);
            });
            scope.$watch('paletteColorLength', function() {
                cropHost.setPaletteColorLength(scope.paletteColorLength);
            });
            scope.$watch('aspectRatio', function() {
                if(typeof scope.aspectRatio=='string' && scope.aspectRatio!=''){
                    scope.aspectRatio=parseInt(scope.aspectRatio);
                }
                if(scope.aspectRatio) cropHost.setAspect(scope.aspectRatio);
            });

            // Update CropHost dimensions when the directive element is resized
            scope.$watch(
                function() {
                    return [element[0].clientWidth, element[0].clientHeight];
                },
                function(value) {
                    cropHost.setMaxDimensions(value[0], value[1]);
                    updateResultImage(scope);
                },
                true
            );

            // Destroy CropHost Instance when the directive is destroying
            scope.$on('$destroy', function() {
                cropHost.destroy();
            });
        }
    };
}]);

/* canvas-toBlob.js
 * A canvas.toBlob() implementation.
 * 2013-12-27
 * 
 * By Eli Grey, http://eligrey.com and Devin Samarin, https://github.com/eboyjr
 * License: X11/MIT
 *   See https://github.com/eligrey/canvas-toBlob.js/blob/master/LICENSE.md
 */

/*global self */
/*jslint bitwise: true, regexp: true, confusion: true, es5: true, vars: true, white: true,
  plusplus: true */

/*! @source http://purl.eligrey.com/github/canvas-toBlob.js/blob/master/canvas-toBlob.js */

(function(view) {
    "use strict";
    var
        Uint8Array = view.Uint8Array,
        HTMLCanvasElement = view.HTMLCanvasElement,
        canvas_proto = HTMLCanvasElement && HTMLCanvasElement.prototype,
        is_base64_regex = /\s*;\s*base64\s*(?:;|$)/i,
        to_data_url = "toDataURL",
        base64_ranks, decode_base64 = function(base64) {
            var
                len = base64.length,
                buffer = new Uint8Array(len / 4 * 3 | 0),
                i = 0,
                outptr = 0,
                last = [0, 0],
                state = 0,
                save = 0,
                rank, code, undef;
            while (len--) {
                code = base64.charCodeAt(i++);
                rank = base64_ranks[code - 43];
                if (rank !== 255 && rank !== undef) {
                    last[1] = last[0];
                    last[0] = code;
                    save = (save << 6) | rank;
                    state++;
                    if (state === 4) {
                        buffer[outptr++] = save >>> 16;
                        if (last[1] !== 61 /* padding character */ ) {
                            buffer[outptr++] = save >>> 8;
                        }
                        if (last[0] !== 61 /* padding character */ ) {
                            buffer[outptr++] = save;
                        }
                        state = 0;
                    }
                }
            }
            // 2/3 chance there's going to be some null bytes at the end, but that
            // doesn't really matter with most image formats.
            // If it somehow matters for you, truncate the buffer up outptr.
            return buffer;
        };
    if (Uint8Array) {
        base64_ranks = new Uint8Array([
            62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, 0, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51
        ]);
    }
    if (HTMLCanvasElement && !canvas_proto.toBlob) {
        canvas_proto.toBlob = function(callback, type /*, ...args*/ ) {
            if (!type) {
                type = "image/png";
            }
            if (this.mozGetAsFile) {
                callback(this.mozGetAsFile("canvas", type));
                return;
            }
            if (this.msToBlob && /^\s*image\/png\s*(?:$|;)/i.test(type)) {
                callback(this.msToBlob());
                return;
            }

            var
                args = Array.prototype.slice.call(arguments, 1),
                dataURI = this[to_data_url].apply(this, args),
                header_end = dataURI.indexOf(","),
                data = dataURI.substring(header_end + 1),
                is_base64 = is_base64_regex.test(dataURI.substring(0, header_end)),
                blob;
            if (Blob.fake) {
                // no reason to decode a data: URI that's just going to become a data URI again
                blob = new Blob
                if (is_base64) {
                    blob.encoding = "base64";
                } else {
                    blob.encoding = "URI";
                }
                blob.data = data;
                blob.size = data.length;
            } else if (Uint8Array) {
                if (is_base64) {
                    blob = new Blob([decode_base64(data)], {
                        type: type
                    });
                } else {
                    blob = new Blob([decodeURIComponent(data)], {
                        type: type
                    });
                }
            }
            if (typeof callback !== 'undefined') {
                callback(blob);
            }
        };

        if (canvas_proto.toDataURLHD) {
            canvas_proto.toBlobHD = function() {
                to_data_url = "toDataURLHD";
                var blob = this.toBlob();
                to_data_url = "toDataURL";
                return blob;
            }
        } else {
            canvas_proto.toBlobHD = canvas_proto.toBlob;
        }
    }
}(typeof self !== "undefined" && self || typeof window !== "undefined" && window || this.content || this));

/*!
 * Color Thief v2.0
 * by Lokesh Dhakar - http://www.lokeshdhakar.com
 *
 * Thanks
 * ------
 * Nick Rabinowitz - For creating quantize.js.
 * John Schulz - For clean up and optimization. @JFSIII
 * Nathan Spady - For adding drag and drop support to the demo page.
 *
 * License
 * -------
 * Copyright 2011, 2015 Lokesh Dhakar
 * Released under the MIT license
 * https://raw.githubusercontent.com/lokesh/color-thief/master/LICENSE
 *
 */
(function() {
    /*!
     * Color Thief v2.0
     * by Lokesh Dhakar - http://www.lokeshdhakar.com
     *
     * Thanks
     * ------
     * Nick Rabinowitz - For creating quantize.js.
     * John Schulz - For clean up and optimization. @JFSIII
     * Nathan Spady - For adding drag and drop support to the demo page.
     *
     * License
     * -------
     * Copyright 2011, 2015 Lokesh Dhakar
     * Released under the MIT license
     * https://raw.githubusercontent.com/lokesh/color-thief/master/LICENSE
     *
     */

    /*
      CanvasImage Class
      Class that wraps the html image element and canvas.
      It also simplifies some of the canvas context manipulation
      with a set of helper functions.
    */
    var CanvasImage = function(image) {
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');

        document.body.appendChild(this.canvas);

        this.width = this.canvas.width = image.width;
        this.height = this.canvas.height = image.height;

        this.context.drawImage(image, 0, 0, this.width, this.height);
    };

    CanvasImage.prototype.clear = function() {
        this.context.clearRect(0, 0, this.width, this.height);
    };

    CanvasImage.prototype.update = function(imageData) {
        this.context.putImageData(imageData, 0, 0);
    };

    CanvasImage.prototype.getPixelCount = function() {
        return this.width * this.height;
    };

    CanvasImage.prototype.getImageData = function() {
        return this.context.getImageData(0, 0, this.width, this.height);
    };

    CanvasImage.prototype.removeCanvas = function() {
        this.canvas.parentNode.removeChild(this.canvas);
    };

    var ColorThief = function() {};

    /*
     * getColor(sourceImage[, quality])
     * returns {r: num, g: num, b: num}
     *
     * Use the median cut algorithm provided by quantize.js to cluster similar
     * colors and return the base color from the largest cluster.
     *
     * Quality is an optional argument. It needs to be an integer. 1 is the highest quality settings.
     * 10 is the default. There is a trade-off between quality and speed. The bigger the number, the
     * faster a color will be returned but the greater the likelihood that it will not be the visually
     * most dominant color.
     *
     * */
    ColorThief.prototype.getColor = function(sourceImage, quality) {
        var palette = this.getPalette(sourceImage, 5, quality);
        var dominantColor = palette[0];
        return dominantColor;
    };

    /*
     * getPalette(sourceImage[, colorCount, quality])
     * returns array[ {r: num, g: num, b: num}, {r: num, g: num, b: num}, ...]
     *
     * Use the median cut algorithm provided by quantize.js to cluster similar colors.
     *
     * colorCount determines the size of the palette; the number of colors returned. If not set, it
     * defaults to 10.
     *
     * BUGGY: Function does not always return the requested amount of colors. It can be +/- 2.
     *
     * quality is an optional argument. It needs to be an integer. 1 is the highest quality settings.
     * 10 is the default. There is a trade-off between quality and speed. The bigger the number, the
     * faster the palette generation but the greater the likelihood that colors will be missed.
     *
     *
     */
    ColorThief.prototype.getPalette = function(sourceImage, colorCount, quality) {

        if (typeof colorCount === 'undefined') {
            colorCount = 10;
        }
        if (typeof quality === 'undefined' || quality < 1) {
            quality = 10;
        }

        // Create custom CanvasImage object
        var image = new CanvasImage(sourceImage);
        var imageData = image.getImageData();
        var pixels = imageData.data;
        var pixelCount = image.getPixelCount();

        // Store the RGB values in an array format suitable for quantize function
        var pixelArray = [];
        for (var i = 0, offset, r, g, b, a; i < pixelCount; i = i + quality) {
            offset = i * 4;
            r = pixels[offset + 0];
            g = pixels[offset + 1];
            b = pixels[offset + 2];
            a = pixels[offset + 3];
            // If pixel is mostly opaque and not white
            if (a >= 125) {
                if (!(r > 250 && g > 250 && b > 250)) {
                    pixelArray.push([r, g, b]);
                }
            }
        }

        // Send array to quantize function which clusters values
        // using median cut algorithm
        var cmap = MMCQ.quantize(pixelArray, colorCount);
        var palette = cmap ? cmap.palette() : null;

        // Clean up
        image.removeCanvas();

        return palette;
    };

    /*!
     * quantize.js Copyright 2008 Nick Rabinowitz.
     * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
     */

    // fill out a couple protovis dependencies
    /*!
     * Block below copied from Protovis: http://mbostock.github.com/protovis/
     * Copyright 2010 Stanford Visualization Group
     * Licensed under the BSD License: http://www.opensource.org/licenses/bsd-license.php
     */
    if (!pv) {
        var pv = {
            map: function(array, f) {
                var o = {};
                return f ? array.map(function(d, i) {
                    o.index = i;
                    return f.call(o, d);
                }) : array.slice();
            },
            naturalOrder: function(a, b) {
                return (a < b) ? -1 : ((a > b) ? 1 : 0);
            },
            sum: function(array, f) {
                var o = {};
                return array.reduce(f ? function(p, d, i) {
                    o.index = i;
                    return p + f.call(o, d);
                } : function(p, d) {
                    return p + d;
                }, 0);
            },
            max: function(array, f) {
                return Math.max.apply(null, f ? pv.map(array, f) : array);
            }
        };
    }

    /**
     * Basic Javascript port of the MMCQ (modified median cut quantization)
     * algorithm from the Leptonica library (http://www.leptonica.com/).
     * Returns a color map you can use to map original pixels to the reduced
     * palette. Still a work in progress.
     *
     * @author Nick Rabinowitz
     * @example

    // array of pixels as [R,G,B] arrays
    var myPixels = [[190,197,190], [202,204,200], [207,214,210], [211,214,211], [205,207,207]
                    // etc
                    ];
    var maxColors = 4;

    var cmap = MMCQ.quantize(myPixels, maxColors);
    var newPalette = cmap.palette();
    var newPixels = myPixels.map(function(p) {
        return cmap.map(p);
    });

     */
    var MMCQ = (function() {
        // private constants
        var sigbits = 5,
            rshift = 8 - sigbits,
            maxIterations = 1000,
            fractByPopulations = 0.75;

        // get reduced-space color index for a pixel
        function getColorIndex(r, g, b) {
            return (r << (2 * sigbits)) + (g << sigbits) + b;
        }

        // Simple priority queue
        function PQueue(comparator) {
            var contents = [],
                sorted = false;

            function sort() {
                contents.sort(comparator);
                sorted = true;
            }

            return {
                push: function(o) {
                    contents.push(o);
                    sorted = false;
                },
                peek: function(index) {
                    if (!sorted) sort();
                    if (index === undefined) index = contents.length - 1;
                    return contents[index];
                },
                pop: function() {
                    if (!sorted) sort();
                    return contents.pop();
                },
                size: function() {
                    return contents.length;
                },
                map: function(f) {
                    return contents.map(f);
                },
                debug: function() {
                    if (!sorted) sort();
                    return contents;
                }
            };
        }

        // 3d color space box
        function VBox(r1, r2, g1, g2, b1, b2, histo) {
            var vbox = this;
            vbox.r1 = r1;
            vbox.r2 = r2;
            vbox.g1 = g1;
            vbox.g2 = g2;
            vbox.b1 = b1;
            vbox.b2 = b2;
            vbox.histo = histo;
        }
        VBox.prototype = {
            volume: function(force) {
                var vbox = this;
                if (!vbox._volume || force) {
                    vbox._volume = ((vbox.r2 - vbox.r1 + 1) * (vbox.g2 - vbox.g1 + 1) * (vbox.b2 - vbox.b1 + 1));
                }
                return vbox._volume;
            },
            count: function(force) {
                var vbox = this,
                    histo = vbox.histo;
                if (!vbox._count_set || force) {
                    var npix = 0,
                        i, j, k;
                    for (i = vbox.r1; i <= vbox.r2; i++) {
                        for (j = vbox.g1; j <= vbox.g2; j++) {
                            for (k = vbox.b1; k <= vbox.b2; k++) {
                                index = getColorIndex(i, j, k);
                                npix += (histo[index] || 0);
                            }
                        }
                    }
                    vbox._count = npix;
                    vbox._count_set = true;
                }
                return vbox._count;
            },
            copy: function() {
                var vbox = this;
                return new VBox(vbox.r1, vbox.r2, vbox.g1, vbox.g2, vbox.b1, vbox.b2, vbox.histo);
            },
            avg: function(force) {
                var vbox = this,
                    histo = vbox.histo;
                if (!vbox._avg || force) {
                    var ntot = 0,
                        mult = 1 << (8 - sigbits),
                        rsum = 0,
                        gsum = 0,
                        bsum = 0,
                        hval,
                        i, j, k, histoindex;
                    for (i = vbox.r1; i <= vbox.r2; i++) {
                        for (j = vbox.g1; j <= vbox.g2; j++) {
                            for (k = vbox.b1; k <= vbox.b2; k++) {
                                histoindex = getColorIndex(i, j, k);
                                hval = histo[histoindex] || 0;
                                ntot += hval;
                                rsum += (hval * (i + 0.5) * mult);
                                gsum += (hval * (j + 0.5) * mult);
                                bsum += (hval * (k + 0.5) * mult);
                            }
                        }
                    }
                    if (ntot) {
                        vbox._avg = [~~(rsum / ntot), ~~(gsum / ntot), ~~(bsum / ntot)];
                    } else {
                        //                    console.log('empty box');
                        vbox._avg = [~~(mult * (vbox.r1 + vbox.r2 + 1) / 2), ~~(mult * (vbox.g1 + vbox.g2 + 1) / 2), ~~(mult * (vbox.b1 + vbox.b2 + 1) / 2)];
                    }
                }
                return vbox._avg;
            },
            contains: function(pixel) {
                var vbox = this,
                    rval = pixel[0] >> rshift;
                gval = pixel[1] >> rshift;
                bval = pixel[2] >> rshift;
                return (rval >= vbox.r1 && rval <= vbox.r2 &&
                    gval >= vbox.g1 && gval <= vbox.g2 &&
                    bval >= vbox.b1 && bval <= vbox.b2);
            }
        };

        // Color map
        function CMap() {
            this.vboxes = new PQueue(function(a, b) {
                return pv.naturalOrder(
                    a.vbox.count() * a.vbox.volume(),
                    b.vbox.count() * b.vbox.volume()
                );
            });
        }
        CMap.prototype = {
            push: function(vbox) {
                this.vboxes.push({
                    vbox: vbox,
                    color: vbox.avg()
                });
            },
            palette: function() {
                return this.vboxes.map(function(vb) {
                    return vb.color;
                });
            },
            size: function() {
                return this.vboxes.size();
            },
            map: function(color) {
                var vboxes = this.vboxes;
                for (var i = 0; i < vboxes.size(); i++) {
                    if (vboxes.peek(i).vbox.contains(color)) {
                        return vboxes.peek(i).color;
                    }
                }
                return this.nearest(color);
            },
            nearest: function(color) {
                var vboxes = this.vboxes,
                    d1, d2, pColor;
                for (var i = 0; i < vboxes.size(); i++) {
                    d2 = Math.sqrt(
                        Math.pow(color[0] - vboxes.peek(i).color[0], 2) +
                        Math.pow(color[1] - vboxes.peek(i).color[1], 2) +
                        Math.pow(color[2] - vboxes.peek(i).color[2], 2)
                    );
                    if (d2 < d1 || d1 === undefined) {
                        d1 = d2;
                        pColor = vboxes.peek(i).color;
                    }
                }
                return pColor;
            },
            forcebw: function() {
                // XXX: won't  work yet
                var vboxes = this.vboxes;
                vboxes.sort(function(a, b) {
                    return pv.naturalOrder(pv.sum(a.color), pv.sum(b.color));
                });

                // force darkest color to black if everything < 5
                var lowest = vboxes[0].color;
                if (lowest[0] < 5 && lowest[1] < 5 && lowest[2] < 5)
                    vboxes[0].color = [0, 0, 0];

                // force lightest color to white if everything > 251
                var idx = vboxes.length - 1,
                    highest = vboxes[idx].color;
                if (highest[0] > 251 && highest[1] > 251 && highest[2] > 251)
                    vboxes[idx].color = [255, 255, 255];
            }
        };

        // histo (1-d array, giving the number of pixels in
        // each quantized region of color space), or null on error
        function getHisto(pixels) {
            var histosize = 1 << (3 * sigbits),
                histo = new Array(histosize),
                index, rval, gval, bval;
            pixels.forEach(function(pixel) {
                rval = pixel[0] >> rshift;
                gval = pixel[1] >> rshift;
                bval = pixel[2] >> rshift;
                index = getColorIndex(rval, gval, bval);
                histo[index] = (histo[index] || 0) + 1;
            });
            return histo;
        }

        function vboxFromPixels(pixels, histo) {
            var rmin = 1000000,
                rmax = 0,
                gmin = 1000000,
                gmax = 0,
                bmin = 1000000,
                bmax = 0,
                rval, gval, bval;
            // find min/max
            pixels.forEach(function(pixel) {
                rval = pixel[0] >> rshift;
                gval = pixel[1] >> rshift;
                bval = pixel[2] >> rshift;
                if (rval < rmin) rmin = rval;
                else if (rval > rmax) rmax = rval;
                if (gval < gmin) gmin = gval;
                else if (gval > gmax) gmax = gval;
                if (bval < bmin) bmin = bval;
                else if (bval > bmax) bmax = bval;
            });
            return new VBox(rmin, rmax, gmin, gmax, bmin, bmax, histo);
        }

        function medianCutApply(histo, vbox) {
            if (!vbox.count()) return;

            var rw = vbox.r2 - vbox.r1 + 1,
                gw = vbox.g2 - vbox.g1 + 1,
                bw = vbox.b2 - vbox.b1 + 1,
                maxw = pv.max([rw, gw, bw]);
            // only one pixel, no split
            if (vbox.count() == 1) {
                return [vbox.copy()];
            }
            /* Find the partial sum arrays along the selected axis. */
            var total = 0,
                partialsum = [],
                lookaheadsum = [],
                i, j, k, sum, index;
            if (maxw == rw) {
                for (i = vbox.r1; i <= vbox.r2; i++) {
                    sum = 0;
                    for (j = vbox.g1; j <= vbox.g2; j++) {
                        for (k = vbox.b1; k <= vbox.b2; k++) {
                            index = getColorIndex(i, j, k);
                            sum += (histo[index] || 0);
                        }
                    }
                    total += sum;
                    partialsum[i] = total;
                }
            } else if (maxw == gw) {
                for (i = vbox.g1; i <= vbox.g2; i++) {
                    sum = 0;
                    for (j = vbox.r1; j <= vbox.r2; j++) {
                        for (k = vbox.b1; k <= vbox.b2; k++) {
                            index = getColorIndex(j, i, k);
                            sum += (histo[index] || 0);
                        }
                    }
                    total += sum;
                    partialsum[i] = total;
                }
            } else { /* maxw == bw */
                for (i = vbox.b1; i <= vbox.b2; i++) {
                    sum = 0;
                    for (j = vbox.r1; j <= vbox.r2; j++) {
                        for (k = vbox.g1; k <= vbox.g2; k++) {
                            index = getColorIndex(j, k, i);
                            sum += (histo[index] || 0);
                        }
                    }
                    total += sum;
                    partialsum[i] = total;
                }
            }
            partialsum.forEach(function(d, i) {
                lookaheadsum[i] = total - d;
            });

            function doCut(color) {
                var dim1 = color + '1',
                    dim2 = color + '2',
                    left, right, vbox1, vbox2, d2, count2 = 0;
                for (i = vbox[dim1]; i <= vbox[dim2]; i++) {
                    if (partialsum[i] > total / 2) {
                        vbox1 = vbox.copy();
                        vbox2 = vbox.copy();
                        left = i - vbox[dim1];
                        right = vbox[dim2] - i;
                        if (left <= right)
                            d2 = Math.min(vbox[dim2] - 1, ~~(i + right / 2));
                        else d2 = Math.max(vbox[dim1], ~~(i - 1 - left / 2));
                        // avoid 0-count boxes
                        while (!partialsum[d2]) d2++;
                        count2 = lookaheadsum[d2];
                        while (!count2 && partialsum[d2 - 1]) count2 = lookaheadsum[--d2];
                        // set dimensions
                        vbox1[dim2] = d2;
                        vbox2[dim1] = vbox1[dim2] + 1;
                        //                    console.log('vbox counts:', vbox.count(), vbox1.count(), vbox2.count());
                        return [vbox1, vbox2];
                    }
                }

            }
            // determine the cut planes
            return maxw == rw ? doCut('r') :
                maxw == gw ? doCut('g') :
                doCut('b');
        }

        function quantize(pixels, maxcolors) {
            // short-circuit
            if (!pixels.length || maxcolors < 2 || maxcolors > 256) {
                //            console.log('wrong number of maxcolors');
                return false;
            }

            // XXX: check color content and convert to grayscale if insufficient

            var histo = getHisto(pixels),
                histosize = 1 << (3 * sigbits);

            // check that we aren't below maxcolors already
            var nColors = 0;
            histo.forEach(function() {
                nColors++;
            });
            if (nColors <= maxcolors) {
                // XXX: generate the new colors from the histo and return
            }

            // get the beginning vbox from the colors
            var vbox = vboxFromPixels(pixels, histo),
                pq = new PQueue(function(a, b) {
                    return pv.naturalOrder(a.count(), b.count());
                });
            pq.push(vbox);

            // inner function to do the iteration
            function iter(lh, target) {
                var ncolors = 1,
                    niters = 0,
                    vbox;
                while (niters < maxIterations) {
                    vbox = lh.pop();
                    if (!vbox.count()) { /* just put it back */
                        lh.push(vbox);
                        niters++;
                        continue;
                    }
                    // do the cut
                    var vboxes = medianCutApply(histo, vbox),
                        vbox1 = vboxes[0],
                        vbox2 = vboxes[1];

                    if (!vbox1) {
                        //                    console.log("vbox1 not defined; shouldn't happen!");
                        return;
                    }
                    lh.push(vbox1);
                    if (vbox2) { /* vbox2 can be null */
                        lh.push(vbox2);
                        ncolors++;
                    }
                    if (ncolors >= target) return;
                    if (niters++ > maxIterations) {
                        //                    console.log("infinite loop; perhaps too few pixels!");
                        return;
                    }
                }
            }

            // first set of colors, sorted by population
            iter(pq, fractByPopulations * maxcolors);

            // Re-sort by the product of pixel occupancy times the size in color space.
            var pq2 = new PQueue(function(a, b) {
                return pv.naturalOrder(a.count() * a.volume(), b.count() * b.volume());
            });
            while (pq.size()) {
                pq2.push(pq.pop());
            }

            // next set - generate the median cuts using the (npix * vol) sorting.
            iter(pq2, maxcolors - pq2.size());

            // calculate the actual colors
            var cmap = new CMap();
            while (pq2.size()) {
                cmap.push(pq2.pop());
            }

            return cmap;
        }

        return {
            quantize: quantize
        };
    })();

    /**
     * Export class to global
     */
    if (typeof define === 'function' && define.amd) {
        define([], function() {
            return ColorThief;
        }); // for AMD loader
    } else if (typeof exports === 'object') {
        module.exports = ColorThief; // for CommonJS
    } else {
        this.ColorThief = ColorThief;
    }
}.call(this));

}());

/*!
 * Exif.js v2.1.1
 * https://github.com/exif-js/exif-js
 */
(function() {

    var debug = false;

    var root = this;

    var EXIF = function(obj) {
        if (obj instanceof EXIF) return obj;
        if (!(this instanceof EXIF)) return new EXIF(obj);
        this.EXIFwrapped = obj;
    };

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = EXIF;
        }
        exports.EXIF = EXIF;
    } else {
        root.EXIF = EXIF;
    }

    var ExifTags = EXIF.Tags = {

        // version tags
        0x9000 : "ExifVersion",             // EXIF version
        0xA000 : "FlashpixVersion",         // Flashpix format version

        // colorspace tags
        0xA001 : "ColorSpace",              // Color space information tag

        // image configuration
        0xA002 : "PixelXDimension",         // Valid width of meaningful image
        0xA003 : "PixelYDimension",         // Valid height of meaningful image
        0x9101 : "ComponentsConfiguration", // Information about channels
        0x9102 : "CompressedBitsPerPixel",  // Compressed bits per pixel

        // user information
        0x927C : "MakerNote",               // Any desired information written by the manufacturer
        0x9286 : "UserComment",             // Comments by user

        // related file
        0xA004 : "RelatedSoundFile",        // Name of related sound file

        // date and time
        0x9003 : "DateTimeOriginal",        // Date and time when the original image was generated
        0x9004 : "DateTimeDigitized",       // Date and time when the image was stored digitally
        0x9290 : "SubsecTime",              // Fractions of seconds for DateTime
        0x9291 : "SubsecTimeOriginal",      // Fractions of seconds for DateTimeOriginal
        0x9292 : "SubsecTimeDigitized",     // Fractions of seconds for DateTimeDigitized

        // picture-taking conditions
        0x829A : "ExposureTime",            // Exposure time (in seconds)
        0x829D : "FNumber",                 // F number
        0x8822 : "ExposureProgram",         // Exposure program
        0x8824 : "SpectralSensitivity",     // Spectral sensitivity
        0x8827 : "ISOSpeedRatings",         // ISO speed rating
        0x8828 : "OECF",                    // Optoelectric conversion factor
        0x9201 : "ShutterSpeedValue",       // Shutter speed
        0x9202 : "ApertureValue",           // Lens aperture
        0x9203 : "BrightnessValue",         // Value of brightness
        0x9204 : "ExposureBias",            // Exposure bias
        0x9205 : "MaxApertureValue",        // Smallest F number of lens
        0x9206 : "SubjectDistance",         // Distance to subject in meters
        0x9207 : "MeteringMode",            // Metering mode
        0x9208 : "LightSource",             // Kind of light source
        0x9209 : "Flash",                   // Flash status
        0x9214 : "SubjectArea",             // Location and area of main subject
        0x920A : "FocalLength",             // Focal length of the lens in mm
        0xA20B : "FlashEnergy",             // Strobe energy in BCPS
        0xA20C : "SpatialFrequencyResponse",    //
        0xA20E : "FocalPlaneXResolution",   // Number of pixels in width direction per FocalPlaneResolutionUnit
        0xA20F : "FocalPlaneYResolution",   // Number of pixels in height direction per FocalPlaneResolutionUnit
        0xA210 : "FocalPlaneResolutionUnit",    // Unit for measuring FocalPlaneXResolution and FocalPlaneYResolution
        0xA214 : "SubjectLocation",         // Location of subject in image
        0xA215 : "ExposureIndex",           // Exposure index selected on camera
        0xA217 : "SensingMethod",           // Image sensor type
        0xA300 : "FileSource",              // Image source (3 == DSC)
        0xA301 : "SceneType",               // Scene type (1 == directly photographed)
        0xA302 : "CFAPattern",              // Color filter array geometric pattern
        0xA401 : "CustomRendered",          // Special processing
        0xA402 : "ExposureMode",            // Exposure mode
        0xA403 : "WhiteBalance",            // 1 = auto white balance, 2 = manual
        0xA404 : "DigitalZoomRation",       // Digital zoom ratio
        0xA405 : "FocalLengthIn35mmFilm",   // Equivalent foacl length assuming 35mm film camera (in mm)
        0xA406 : "SceneCaptureType",        // Type of scene
        0xA407 : "GainControl",             // Degree of overall image gain adjustment
        0xA408 : "Contrast",                // Direction of contrast processing applied by camera
        0xA409 : "Saturation",              // Direction of saturation processing applied by camera
        0xA40A : "Sharpness",               // Direction of sharpness processing applied by camera
        0xA40B : "DeviceSettingDescription",    //
        0xA40C : "SubjectDistanceRange",    // Distance to subject

        // other tags
        0xA005 : "InteroperabilityIFDPointer",
        0xA420 : "ImageUniqueID"            // Identifier assigned uniquely to each image
    };

    var TiffTags = EXIF.TiffTags = {
        0x0100 : "ImageWidth",
        0x0101 : "ImageHeight",
        0x8769 : "ExifIFDPointer",
        0x8825 : "GPSInfoIFDPointer",
        0xA005 : "InteroperabilityIFDPointer",
        0x0102 : "BitsPerSample",
        0x0103 : "Compression",
        0x0106 : "PhotometricInterpretation",
        0x0112 : "Orientation",
        0x0115 : "SamplesPerPixel",
        0x011C : "PlanarConfiguration",
        0x0212 : "YCbCrSubSampling",
        0x0213 : "YCbCrPositioning",
        0x011A : "XResolution",
        0x011B : "YResolution",
        0x0128 : "ResolutionUnit",
        0x0111 : "StripOffsets",
        0x0116 : "RowsPerStrip",
        0x0117 : "StripByteCounts",
        0x0201 : "JPEGInterchangeFormat",
        0x0202 : "JPEGInterchangeFormatLength",
        0x012D : "TransferFunction",
        0x013E : "WhitePoint",
        0x013F : "PrimaryChromaticities",
        0x0211 : "YCbCrCoefficients",
        0x0214 : "ReferenceBlackWhite",
        0x0132 : "DateTime",
        0x010E : "ImageDescription",
        0x010F : "Make",
        0x0110 : "Model",
        0x0131 : "Software",
        0x013B : "Artist",
        0x8298 : "Copyright"
    };

    var GPSTags = EXIF.GPSTags = {
        0x0000 : "GPSVersionID",
        0x0001 : "GPSLatitudeRef",
        0x0002 : "GPSLatitude",
        0x0003 : "GPSLongitudeRef",
        0x0004 : "GPSLongitude",
        0x0005 : "GPSAltitudeRef",
        0x0006 : "GPSAltitude",
        0x0007 : "GPSTimeStamp",
        0x0008 : "GPSSatellites",
        0x0009 : "GPSStatus",
        0x000A : "GPSMeasureMode",
        0x000B : "GPSDOP",
        0x000C : "GPSSpeedRef",
        0x000D : "GPSSpeed",
        0x000E : "GPSTrackRef",
        0x000F : "GPSTrack",
        0x0010 : "GPSImgDirectionRef",
        0x0011 : "GPSImgDirection",
        0x0012 : "GPSMapDatum",
        0x0013 : "GPSDestLatitudeRef",
        0x0014 : "GPSDestLatitude",
        0x0015 : "GPSDestLongitudeRef",
        0x0016 : "GPSDestLongitude",
        0x0017 : "GPSDestBearingRef",
        0x0018 : "GPSDestBearing",
        0x0019 : "GPSDestDistanceRef",
        0x001A : "GPSDestDistance",
        0x001B : "GPSProcessingMethod",
        0x001C : "GPSAreaInformation",
        0x001D : "GPSDateStamp",
        0x001E : "GPSDifferential"
    };

    var StringValues = EXIF.StringValues = {
        ExposureProgram : {
            0 : "Not defined",
            1 : "Manual",
            2 : "Normal program",
            3 : "Aperture priority",
            4 : "Shutter priority",
            5 : "Creative program",
            6 : "Action program",
            7 : "Portrait mode",
            8 : "Landscape mode"
        },
        MeteringMode : {
            0 : "Unknown",
            1 : "Average",
            2 : "CenterWeightedAverage",
            3 : "Spot",
            4 : "MultiSpot",
            5 : "Pattern",
            6 : "Partial",
            255 : "Other"
        },
        LightSource : {
            0 : "Unknown",
            1 : "Daylight",
            2 : "Fluorescent",
            3 : "Tungsten (incandescent light)",
            4 : "Flash",
            9 : "Fine weather",
            10 : "Cloudy weather",
            11 : "Shade",
            12 : "Daylight fluorescent (D 5700 - 7100K)",
            13 : "Day white fluorescent (N 4600 - 5400K)",
            14 : "Cool white fluorescent (W 3900 - 4500K)",
            15 : "White fluorescent (WW 3200 - 3700K)",
            17 : "Standard light A",
            18 : "Standard light B",
            19 : "Standard light C",
            20 : "D55",
            21 : "D65",
            22 : "D75",
            23 : "D50",
            24 : "ISO studio tungsten",
            255 : "Other"
        },
        Flash : {
            0x0000 : "Flash did not fire",
            0x0001 : "Flash fired",
            0x0005 : "Strobe return light not detected",
            0x0007 : "Strobe return light detected",
            0x0009 : "Flash fired, compulsory flash mode",
            0x000D : "Flash fired, compulsory flash mode, return light not detected",
            0x000F : "Flash fired, compulsory flash mode, return light detected",
            0x0010 : "Flash did not fire, compulsory flash mode",
            0x0018 : "Flash did not fire, auto mode",
            0x0019 : "Flash fired, auto mode",
            0x001D : "Flash fired, auto mode, return light not detected",
            0x001F : "Flash fired, auto mode, return light detected",
            0x0020 : "No flash function",
            0x0041 : "Flash fired, red-eye reduction mode",
            0x0045 : "Flash fired, red-eye reduction mode, return light not detected",
            0x0047 : "Flash fired, red-eye reduction mode, return light detected",
            0x0049 : "Flash fired, compulsory flash mode, red-eye reduction mode",
            0x004D : "Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected",
            0x004F : "Flash fired, compulsory flash mode, red-eye reduction mode, return light detected",
            0x0059 : "Flash fired, auto mode, red-eye reduction mode",
            0x005D : "Flash fired, auto mode, return light not detected, red-eye reduction mode",
            0x005F : "Flash fired, auto mode, return light detected, red-eye reduction mode"
        },
        SensingMethod : {
            1 : "Not defined",
            2 : "One-chip color area sensor",
            3 : "Two-chip color area sensor",
            4 : "Three-chip color area sensor",
            5 : "Color sequential area sensor",
            7 : "Trilinear sensor",
            8 : "Color sequential linear sensor"
        },
        SceneCaptureType : {
            0 : "Standard",
            1 : "Landscape",
            2 : "Portrait",
            3 : "Night scene"
        },
        SceneType : {
            1 : "Directly photographed"
        },
        CustomRendered : {
            0 : "Normal process",
            1 : "Custom process"
        },
        WhiteBalance : {
            0 : "Auto white balance",
            1 : "Manual white balance"
        },
        GainControl : {
            0 : "None",
            1 : "Low gain up",
            2 : "High gain up",
            3 : "Low gain down",
            4 : "High gain down"
        },
        Contrast : {
            0 : "Normal",
            1 : "Soft",
            2 : "Hard"
        },
        Saturation : {
            0 : "Normal",
            1 : "Low saturation",
            2 : "High saturation"
        },
        Sharpness : {
            0 : "Normal",
            1 : "Soft",
            2 : "Hard"
        },
        SubjectDistanceRange : {
            0 : "Unknown",
            1 : "Macro",
            2 : "Close view",
            3 : "Distant view"
        },
        FileSource : {
            3 : "DSC"
        },

        Components : {
            0 : "",
            1 : "Y",
            2 : "Cb",
            3 : "Cr",
            4 : "R",
            5 : "G",
            6 : "B"
        }
    };

    function addEvent(element, event, handler) {
        if (element.addEventListener) {
            element.addEventListener(event, handler, false);
        } else if (element.attachEvent) {
            element.attachEvent("on" + event, handler);
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
        http.open("GET", url, true);
        http.responseType = "blob";
        http.onload = function(e) {
            if (this.status == 200 || this.status === 0) {
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
                    if (this.status == 200 || this.status === 0) {
                        handleBinaryFile(http.response);
                    } else {
                        throw "Could not load image";
                    }
                    http = null;
                };
                http.open("GET", img.src, true);
                http.responseType = "arraybuffer";
                http.send(null);
            }
        } else if (window.FileReader && (img instanceof window.Blob || img instanceof window.File)) {
            var fileReader = new FileReader();
            fileReader.onload = function(e) {
                if (debug) console.log("Got file of length " + e.target.result.byteLength);
                handleBinaryFile(e.target.result);
            };

            fileReader.readAsArrayBuffer(img);
        }
    }

    function findEXIFinJPEG(file) {
        var dataView = new DataView(file);

        if (debug) console.log("Got file of length " + file.byteLength);
        if ((dataView.getUint8(0) != 0xFF) || (dataView.getUint8(1) != 0xD8)) {
            if (debug) console.log("Not a valid JPEG");
            return false; // not a valid jpeg
        }

        var offset = 2,
            length = file.byteLength,
            marker;

        while (offset < length) {
            if (dataView.getUint8(offset) != 0xFF) {
                if (debug) console.log("Not a valid marker at offset " + offset + ", found: " + dataView.getUint8(offset));
                return false; // not a valid marker, something is wrong
            }

            marker = dataView.getUint8(offset + 1);
            if (debug) console.log(marker);

            // we could implement handling for other markers here,
            // but we're only looking for 0xFFE1 for EXIF data

            if (marker == 225) {
                if (debug) console.log("Found 0xFFE1 marker");

                return readEXIFData(dataView, offset + 4, dataView.getUint16(offset + 2) - 2);

                // offset += 2 + file.getShortAt(offset+2, true);

            } else {
                offset += 2 + dataView.getUint16(offset+2);
            }

        }

    }

    function findIPTCinJPEG(file) {
        var dataView = new DataView(file);

        if (debug) console.log("Got file of length " + file.byteLength);
        if ((dataView.getUint8(0) != 0xFF) || (dataView.getUint8(1) != 0xD8)) {
            if (debug) console.log("Not a valid JPEG");
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
                if(nameHeaderLength % 2 !== 0) nameHeaderLength += 1;
                // Check for pre photoshop 6 format
                if(nameHeaderLength === 0) {
                    // Always 4
                    nameHeaderLength = 4;
                }

                var startOffset = offset + 8 + nameHeaderLength;
                var sectionLength = dataView.getUint16(offset + 6 + nameHeaderLength);

                return readIPTCData(file, startOffset, sectionLength);

                break;

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
            if (!tag && debug) console.log("Unknown tag: " + file.getUint16(entryOffset, !bigEnd));
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
                if (numValues == 1) {
                    return file.getUint8(entryOffset + 8, !bigEnd);
                } else {
                    offset = numValues > 4 ? valueOffset : (entryOffset + 8);
                    vals = [];
                    for (n=0;n<numValues;n++) {
                        vals[n] = file.getUint8(offset + n);
                    }
                    return vals;
                }

            case 2: // ascii, 8-bit byte
                offset = numValues > 4 ? valueOffset : (entryOffset + 8);
                return getStringFromDB(file, offset, numValues-1);

            case 3: // short, 16 bit int
                if (numValues == 1) {
                    return file.getUint16(entryOffset + 8, !bigEnd);
                } else {
                    offset = numValues > 2 ? valueOffset : (entryOffset + 8);
                    vals = [];
                    for (n=0;n<numValues;n++) {
                        vals[n] = file.getUint16(offset + 2*n, !bigEnd);
                    }
                    return vals;
                }

            case 4: // long, 32 bit int
                if (numValues == 1) {
                    return file.getUint32(entryOffset + 8, !bigEnd);
                } else {
                    vals = [];
                    for (n=0;n<numValues;n++) {
                        vals[n] = file.getUint32(valueOffset + 4*n, !bigEnd);
                    }
                    return vals;
                }

            case 5:    // rational = two long values, first is numerator, second is denominator
                if (numValues == 1) {
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

            case 9: // slong, 32 bit signed int
                if (numValues == 1) {
                    return file.getInt32(entryOffset + 8, !bigEnd);
                } else {
                    vals = [];
                    for (n=0;n<numValues;n++) {
                        vals[n] = file.getInt32(valueOffset + 4*n, !bigEnd);
                    }
                    return vals;
                }

            case 10: // signed rational, two slongs, first is numerator, second is denominator
                if (numValues == 1) {
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
        var outstr = "";
        for (n = start; n < start+length; n++) {
            outstr += String.fromCharCode(buffer.getUint8(n));
        }
        return outstr;
    }

    function readEXIFData(file, start) {
        if (getStringFromDB(file, start, 4) != "Exif") {
            if (debug) console.log("Not valid EXIF data! " + getStringFromDB(file, start, 4));
            return false;
        }

        var bigEnd,
            tags, tag,
            exifData, gpsData,
            tiffOffset = start + 6;

        // test for TIFF validity and endianness
        if (file.getUint16(tiffOffset) == 0x4949) {
            bigEnd = false;
        } else if (file.getUint16(tiffOffset) == 0x4D4D) {
            bigEnd = true;
        } else {
            if (debug) console.log("Not valid TIFF data! (no 0x4949 or 0x4D4D)");
            return false;
        }

        if (file.getUint16(tiffOffset+2, !bigEnd) != 0x002A) {
            if (debug) console.log("Not valid TIFF data! (no 0x002A)");
            return false;
        }

        var firstIFDOffset = file.getUint32(tiffOffset+4, !bigEnd);

        if (firstIFDOffset < 0x00000008) {
            if (debug) console.log("Not valid TIFF data! (First offset less than 8)", file.getUint32(tiffOffset+4, !bigEnd));
            return false;
        }

        tags = readTags(file, tiffOffset, tiffOffset + firstIFDOffset, TiffTags, bigEnd);

        if (tags.ExifIFDPointer) {
            exifData = readTags(file, tiffOffset, tiffOffset + tags.ExifIFDPointer, ExifTags, bigEnd);
            for (tag in exifData) {
                switch (tag) {
                    case "LightSource" :
                    case "Flash" :
                    case "MeteringMode" :
                    case "ExposureProgram" :
                    case "SensingMethod" :
                    case "SceneCaptureType" :
                    case "SceneType" :
                    case "CustomRendered" :
                    case "WhiteBalance" :
                    case "GainControl" :
                    case "Contrast" :
                    case "Saturation" :
                    case "Sharpness" :
                    case "SubjectDistanceRange" :
                    case "FileSource" :
                        exifData[tag] = StringValues[tag][exifData[tag]];
                        break;

                    case "ExifVersion" :
                    case "FlashpixVersion" :
                        exifData[tag] = String.fromCharCode(exifData[tag][0], exifData[tag][1], exifData[tag][2], exifData[tag][3]);
                        break;

                    case "ComponentsConfiguration" :
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
                    case "GPSVersionID" :
                        gpsData[tag] = gpsData[tag][0] +
                            "." + gpsData[tag][1] +
                            "." + gpsData[tag][2] +
                            "." + gpsData[tag][3];
                        break;
                }
                tags[tag] = gpsData[tag];
            }
        }

        return tags;
    }

    EXIF.getData = function(img, callback) {
        if ((img instanceof Image || img instanceof HTMLImageElement) && !img.complete) return false;

        if (!imageHasData(img)) {
            getImageData(img, callback);
        } else {
            if (callback) {
                callback.call(img);
            }
        }
        return true;
    }

    EXIF.getTag = function(img, tag) {
        if (!imageHasData(img)) return;
        return img.exifdata[tag];
    }

    EXIF.getAllTags = function(img) {
        if (!imageHasData(img)) return {};
        var a,
            data = img.exifdata,
            tags = {};
        for (a in data) {
            if (data.hasOwnProperty(a)) {
                tags[a] = data[a];
            }
        }
        return tags;
    }

    EXIF.pretty = function(img) {
        if (!imageHasData(img)) return "";
        var a,
            data = img.exifdata,
            strPretty = "";
        for (a in data) {
            if (data.hasOwnProperty(a)) {
                if (typeof data[a] == "object") {
                    if (data[a] instanceof Number) {
                        strPretty += a + " : " + data[a] + " [" + data[a].numerator + "/" + data[a].denominator + "]\r\n";
                    } else {
                        strPretty += a + " : [" + data[a].length + " values]\r\n";
                    }
                } else {
                    strPretty += a + " : " + data[a] + "\r\n";
                }
            }
        }
        return strPretty;
    }

    EXIF.readFromBinaryFile = function(file) {
        return findEXIFinJPEG(file);
    }

    if (typeof define === 'function' && define.amd) {
        define('exif-js', [], function() {
            return EXIF;
        });
    }
}.call(this));


/**
 * Mega pixel image rendering library for iOS6 Safari
 *
 * Fixes iOS6 Safari's image file rendering issue for large size image (over mega-pixel),
 * which causes unexpected subsampling when drawing it in canvas.
 * By using this library, you can safely render the image with proper stretching.
 *
 * Copyright (c) 2012 Shinichi Tomita <shinichi.tomita@gmail.com>
 * Released under the MIT license
 */
(function() {

  /**
   * Detect subsampling in loaded image.
   * In iOS, larger images than 2M pixels may be subsampled in rendering.
   */
  function detectSubsampling(img) {
    var iw = img.naturalWidth, ih = img.naturalHeight;
    if (iw * ih > 1024 * 1024) { // subsampling may happen over megapixel image
      var canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, -iw + 1, 0);
      // subsampled image becomes half smaller in rendering size.
      // check alpha channel value to confirm image is covering edge pixel or not.
      // if alpha value is 0 image is not covering, hence subsampled.
      return ctx.getImageData(0, 0, 1, 1).data[3] === 0;
    } else {
      return false;
    }
  }

  /**
   * Detecting vertical squash in loaded image.
   * Fixes a bug which squash image vertically while drawing into canvas for some images.
   */
  function detectVerticalSquash(img, iw, ih) {
    var canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = ih;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    var data = ctx.getImageData(0, 0, 1, ih).data;
    // search image edge pixel position in case it is squashed vertically.
    var sy = 0;
    var ey = ih;
    var py = ih;
    while (py > sy) {
      var alpha = data[(py - 1) * 4 + 3];
      if (alpha === 0) {
        ey = py;
      } else {
        sy = py;
      }
      py = (ey + sy) >> 1;
    }
    var ratio = (py / ih);
    return (ratio===0)?1:ratio;
  }

  /**
   * Rendering image element (with resizing) and get its data URL
   */
  function renderImageToDataURL(img, options, doSquash) {
    var canvas = document.createElement('canvas');
    renderImageToCanvas(img, canvas, options, doSquash);
    return canvas.toDataURL("image/jpeg", options.quality || 0.8);
  }

  /**
   * Rendering image element (with resizing) into the canvas element
   */
  function renderImageToCanvas(img, canvas, options, doSquash) {
    var iw = img.naturalWidth, ih = img.naturalHeight;
    if (!(iw+ih)) return;
    var width = options.width, height = options.height;
    var ctx = canvas.getContext('2d');
    ctx.save();
    transformCoordinate(canvas, ctx, width, height, options.orientation);
    var subsampled = detectSubsampling(img);
    if (subsampled) {
      iw /= 2;
      ih /= 2;
    }
    var d = 1024; // size of tiling canvas
    var tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = tmpCanvas.height = d;
    var tmpCtx = tmpCanvas.getContext('2d');
    var vertSquashRatio = doSquash ? detectVerticalSquash(img, iw, ih) : 1;
    var dw = Math.ceil(d * width / iw);
    var dh = Math.ceil(d * height / ih / vertSquashRatio);
    var sy = 0;
    var dy = 0;
    while (sy < ih) {
      var sx = 0;
      var dx = 0;
      while (sx < iw) {
        tmpCtx.clearRect(0, 0, d, d);
        tmpCtx.drawImage(img, -sx, -sy);
        ctx.drawImage(tmpCanvas, 0, 0, d, d, dx, dy, dw, dh);
        sx += d;
        dx += dw;
      }
      sy += d;
      dy += dh;
    }
    ctx.restore();
    tmpCanvas = tmpCtx = null;
  }

  /**
   * Transform canvas coordination according to specified frame size and orientation
   * Orientation value is from EXIF tag
   */
  function transformCoordinate(canvas, ctx, width, height, orientation) {
    switch (orientation) {
      case 5:
      case 6:
      case 7:
      case 8:
        canvas.width = height;
        canvas.height = width;
        break;
      default:
        canvas.width = width;
        canvas.height = height;
    }
    switch (orientation) {
      case 2:
        // horizontal flip
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        break;
      case 3:
        // 180 rotate left
        ctx.translate(width, height);
        ctx.rotate(Math.PI);
        break;
      case 4:
        // vertical flip
        ctx.translate(0, height);
        ctx.scale(1, -1);
        break;
      case 5:
        // vertical flip + 90 rotate right
        ctx.rotate(0.5 * Math.PI);
        ctx.scale(1, -1);
        break;
      case 6:
        // 90 rotate right
        ctx.rotate(0.5 * Math.PI);
        ctx.translate(0, -height);
        break;
      case 7:
        // horizontal flip + 90 rotate right
        ctx.rotate(0.5 * Math.PI);
        ctx.translate(width, -height);
        ctx.scale(-1, 1);
        break;
      case 8:
        // 90 rotate left
        ctx.rotate(-0.5 * Math.PI);
        ctx.translate(-width, 0);
        break;
      default:
        break;
    }
  }

  var URL = window.URL && window.URL.createObjectURL ? window.URL :
            window.webkitURL && window.webkitURL.createObjectURL ? window.webkitURL :
            null;

  /**
   * MegaPixImage class
   */
  function MegaPixImage(srcImage) {
    if (window.Blob && srcImage instanceof Blob) {
      if (!URL) { throw Error("No createObjectURL function found to create blob url"); }
      var img = new Image();
      img.src = URL.createObjectURL(srcImage);
      this.blob = srcImage;
      srcImage = img;
    }
    if (!srcImage.naturalWidth && !srcImage.naturalHeight) {
      var _this = this;
      srcImage.onload = srcImage.onerror = function() {
        var listeners = _this.imageLoadListeners;
        if (listeners) {
          _this.imageLoadListeners = null;
          for (var i=0, len=listeners.length; i<len; i++) {
            listeners[i]();
          }
        }
      };
      this.imageLoadListeners = [];
    }
    this.srcImage = srcImage;
  }

  /**
   * Rendering megapix image into specified target element
   */
  MegaPixImage.prototype.render = function(target, options, callback) {
    if (this.imageLoadListeners) {
      var _this = this;
      this.imageLoadListeners.push(function() { _this.render(target, options, callback); });
      return;
    }
    options = options || {};
    var imgWidth = this.srcImage.naturalWidth, imgHeight = this.srcImage.naturalHeight,
        width = options.width, height = options.height,
        maxWidth = options.maxWidth, maxHeight = options.maxHeight,
        doSquash = !this.blob || this.blob.type === 'image/jpeg';
    if (width && !height) {
      height = (imgHeight * width / imgWidth) << 0;
    } else if (height && !width) {
      width = (imgWidth * height / imgHeight) << 0;
    } else {
      width = imgWidth;
      height = imgHeight;
    }
    if (maxWidth && width > maxWidth) {
      width = maxWidth;
      height = (imgHeight * width / imgWidth) << 0;
    }
    if (maxHeight && height > maxHeight) {
      height = maxHeight;
      width = (imgWidth * height / imgHeight) << 0;
    }
    var opt = { width : width, height : height };
    for (var k in options) opt[k] = options[k];

    var tagName = target.tagName.toLowerCase();
    if (tagName === 'img') {
      target.src = renderImageToDataURL(this.srcImage, opt, doSquash);
    } else if (tagName === 'canvas') {
      renderImageToCanvas(this.srcImage, target, opt, doSquash);
    }
    if (typeof this.onrender === 'function') {
      this.onrender(target);
    }
    if (callback) {
      callback();
    }
    if (this.blob) {
      this.blob = null;
      URL.revokeObjectURL(this.srcImage.src);
    }
  };

  /**
   * Export class to global
   */
  if (typeof define === 'function' && define.amd) {
    define([], function() { return MegaPixImage; }); // for AMD loader
  } else if (typeof exports === 'object') {
    module.exports = MegaPixImage; // for CommonJS
  } else {
    this.MegaPixImage = MegaPixImage;
  }

})();

/*!
 * Color Thief v2.0
 * by Lokesh Dhakar - http://www.lokeshdhakar.com
 *
 * Thanks
 * ------
 * Nick Rabinowitz - For creating quantize.js.
 * John Schulz - For clean up and optimization. @JFSIII
 * Nathan Spady - For adding drag and drop support to the demo page.
 *
 * License
 * -------
 * Copyright 2011, 2015 Lokesh Dhakar
 * Released under the MIT license
 * https://raw.githubusercontent.com/lokesh/color-thief/master/LICENSE
 *
 */
(function() {
    /*!
     * Color Thief v2.0
     * by Lokesh Dhakar - http://www.lokeshdhakar.com
     *
     * Thanks
     * ------
     * Nick Rabinowitz - For creating quantize.js.
     * John Schulz - For clean up and optimization. @JFSIII
     * Nathan Spady - For adding drag and drop support to the demo page.
     *
     * License
     * -------
     * Copyright 2011, 2015 Lokesh Dhakar
     * Released under the MIT license
     * https://raw.githubusercontent.com/lokesh/color-thief/master/LICENSE
     *
     */

    /*
      CanvasImage Class
      Class that wraps the html image element and canvas.
      It also simplifies some of the canvas context manipulation
      with a set of helper functions.
    */
    var CanvasImage = function(image) {
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');

        document.body.appendChild(this.canvas);

        this.width = this.canvas.width = image.width;
        this.height = this.canvas.height = image.height;

        this.context.drawImage(image, 0, 0, this.width, this.height);
    };

    CanvasImage.prototype.clear = function() {
        this.context.clearRect(0, 0, this.width, this.height);
    };

    CanvasImage.prototype.update = function(imageData) {
        this.context.putImageData(imageData, 0, 0);
    };

    CanvasImage.prototype.getPixelCount = function() {
        return this.width * this.height;
    };

    CanvasImage.prototype.getImageData = function() {
        return this.context.getImageData(0, 0, this.width, this.height);
    };

    CanvasImage.prototype.removeCanvas = function() {
        this.canvas.parentNode.removeChild(this.canvas);
    };

    var ColorThief = function() {};

    /*
     * getColor(sourceImage[, quality])
     * returns {r: num, g: num, b: num}
     *
     * Use the median cut algorithm provided by quantize.js to cluster similar
     * colors and return the base color from the largest cluster.
     *
     * Quality is an optional argument. It needs to be an integer. 1 is the highest quality settings.
     * 10 is the default. There is a trade-off between quality and speed. The bigger the number, the
     * faster a color will be returned but the greater the likelihood that it will not be the visually
     * most dominant color.
     *
     * */
    ColorThief.prototype.getColor = function(sourceImage, quality) {
        var palette = this.getPalette(sourceImage, 5, quality);
        var dominantColor = palette[0];
        return dominantColor;
    };

    /*
     * getPalette(sourceImage[, colorCount, quality])
     * returns array[ {r: num, g: num, b: num}, {r: num, g: num, b: num}, ...]
     *
     * Use the median cut algorithm provided by quantize.js to cluster similar colors.
     *
     * colorCount determines the size of the palette; the number of colors returned. If not set, it
     * defaults to 10.
     *
     * BUGGY: Function does not always return the requested amount of colors. It can be +/- 2.
     *
     * quality is an optional argument. It needs to be an integer. 1 is the highest quality settings.
     * 10 is the default. There is a trade-off between quality and speed. The bigger the number, the
     * faster the palette generation but the greater the likelihood that colors will be missed.
     *
     *
     */
    ColorThief.prototype.getPalette = function(sourceImage, colorCount, quality) {

        if (typeof colorCount === 'undefined') {
            colorCount = 10;
        }
        if (typeof quality === 'undefined' || quality < 1) {
            quality = 10;
        }

        // Create custom CanvasImage object
        var image = new CanvasImage(sourceImage);
        var imageData = image.getImageData();
        var pixels = imageData.data;
        var pixelCount = image.getPixelCount();

        // Store the RGB values in an array format suitable for quantize function
        var pixelArray = [];
        for (var i = 0, offset, r, g, b, a; i < pixelCount; i = i + quality) {
            offset = i * 4;
            r = pixels[offset + 0];
            g = pixels[offset + 1];
            b = pixels[offset + 2];
            a = pixels[offset + 3];
            // If pixel is mostly opaque and not white
            if (a >= 125) {
                if (!(r > 250 && g > 250 && b > 250)) {
                    pixelArray.push([r, g, b]);
                }
            }
        }

        // Send array to quantize function which clusters values
        // using median cut algorithm
        var cmap = MMCQ.quantize(pixelArray, colorCount);
        var palette = cmap ? cmap.palette() : null;

        // Clean up
        image.removeCanvas();

        return palette;
    };

    /*!
     * quantize.js Copyright 2008 Nick Rabinowitz.
     * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
     */

    // fill out a couple protovis dependencies
    /*!
     * Block below copied from Protovis: http://mbostock.github.com/protovis/
     * Copyright 2010 Stanford Visualization Group
     * Licensed under the BSD License: http://www.opensource.org/licenses/bsd-license.php
     */
    if (!pv) {
        var pv = {
            map: function(array, f) {
                var o = {};
                return f ? array.map(function(d, i) {
                    o.index = i;
                    return f.call(o, d);
                }) : array.slice();
            },
            naturalOrder: function(a, b) {
                return (a < b) ? -1 : ((a > b) ? 1 : 0);
            },
            sum: function(array, f) {
                var o = {};
                return array.reduce(f ? function(p, d, i) {
                    o.index = i;
                    return p + f.call(o, d);
                } : function(p, d) {
                    return p + d;
                }, 0);
            },
            max: function(array, f) {
                return Math.max.apply(null, f ? pv.map(array, f) : array);
            }
        };
    }

    /**
     * Basic Javascript port of the MMCQ (modified median cut quantization)
     * algorithm from the Leptonica library (http://www.leptonica.com/).
     * Returns a color map you can use to map original pixels to the reduced
     * palette. Still a work in progress.
     *
     * @author Nick Rabinowitz
     * @example

    // array of pixels as [R,G,B] arrays
    var myPixels = [[190,197,190], [202,204,200], [207,214,210], [211,214,211], [205,207,207]
                    // etc
                    ];
    var maxColors = 4;

    var cmap = MMCQ.quantize(myPixels, maxColors);
    var newPalette = cmap.palette();
    var newPixels = myPixels.map(function(p) {
        return cmap.map(p);
    });

     */
    var MMCQ = (function() {
        // private constants
        var sigbits = 5,
            rshift = 8 - sigbits,
            maxIterations = 1000,
            fractByPopulations = 0.75;

        // get reduced-space color index for a pixel
        function getColorIndex(r, g, b) {
            return (r << (2 * sigbits)) + (g << sigbits) + b;
        }

        // Simple priority queue
        function PQueue(comparator) {
            var contents = [],
                sorted = false;

            function sort() {
                contents.sort(comparator);
                sorted = true;
            }

            return {
                push: function(o) {
                    contents.push(o);
                    sorted = false;
                },
                peek: function(index) {
                    if (!sorted) sort();
                    if (index === undefined) index = contents.length - 1;
                    return contents[index];
                },
                pop: function() {
                    if (!sorted) sort();
                    return contents.pop();
                },
                size: function() {
                    return contents.length;
                },
                map: function(f) {
                    return contents.map(f);
                },
                debug: function() {
                    if (!sorted) sort();
                    return contents;
                }
            };
        }

        // 3d color space box
        function VBox(r1, r2, g1, g2, b1, b2, histo) {
            var vbox = this;
            vbox.r1 = r1;
            vbox.r2 = r2;
            vbox.g1 = g1;
            vbox.g2 = g2;
            vbox.b1 = b1;
            vbox.b2 = b2;
            vbox.histo = histo;
        }
        VBox.prototype = {
            volume: function(force) {
                var vbox = this;
                if (!vbox._volume || force) {
                    vbox._volume = ((vbox.r2 - vbox.r1 + 1) * (vbox.g2 - vbox.g1 + 1) * (vbox.b2 - vbox.b1 + 1));
                }
                return vbox._volume;
            },
            count: function(force) {
                var vbox = this,
                    histo = vbox.histo;
                if (!vbox._count_set || force) {
                    var npix = 0,
                        i, j, k;
                    for (i = vbox.r1; i <= vbox.r2; i++) {
                        for (j = vbox.g1; j <= vbox.g2; j++) {
                            for (k = vbox.b1; k <= vbox.b2; k++) {
                                index = getColorIndex(i, j, k);
                                npix += (histo[index] || 0);
                            }
                        }
                    }
                    vbox._count = npix;
                    vbox._count_set = true;
                }
                return vbox._count;
            },
            copy: function() {
                var vbox = this;
                return new VBox(vbox.r1, vbox.r2, vbox.g1, vbox.g2, vbox.b1, vbox.b2, vbox.histo);
            },
            avg: function(force) {
                var vbox = this,
                    histo = vbox.histo;
                if (!vbox._avg || force) {
                    var ntot = 0,
                        mult = 1 << (8 - sigbits),
                        rsum = 0,
                        gsum = 0,
                        bsum = 0,
                        hval,
                        i, j, k, histoindex;
                    for (i = vbox.r1; i <= vbox.r2; i++) {
                        for (j = vbox.g1; j <= vbox.g2; j++) {
                            for (k = vbox.b1; k <= vbox.b2; k++) {
                                histoindex = getColorIndex(i, j, k);
                                hval = histo[histoindex] || 0;
                                ntot += hval;
                                rsum += (hval * (i + 0.5) * mult);
                                gsum += (hval * (j + 0.5) * mult);
                                bsum += (hval * (k + 0.5) * mult);
                            }
                        }
                    }
                    if (ntot) {
                        vbox._avg = [~~(rsum / ntot), ~~(gsum / ntot), ~~(bsum / ntot)];
                    } else {
                        //                    console.log('empty box');
                        vbox._avg = [~~(mult * (vbox.r1 + vbox.r2 + 1) / 2), ~~(mult * (vbox.g1 + vbox.g2 + 1) / 2), ~~(mult * (vbox.b1 + vbox.b2 + 1) / 2)];
                    }
                }
                return vbox._avg;
            },
            contains: function(pixel) {
                var vbox = this,
                    rval = pixel[0] >> rshift;
                gval = pixel[1] >> rshift;
                bval = pixel[2] >> rshift;
                return (rval >= vbox.r1 && rval <= vbox.r2 &&
                    gval >= vbox.g1 && gval <= vbox.g2 &&
                    bval >= vbox.b1 && bval <= vbox.b2);
            }
        };

        // Color map
        function CMap() {
            this.vboxes = new PQueue(function(a, b) {
                return pv.naturalOrder(
                    a.vbox.count() * a.vbox.volume(),
                    b.vbox.count() * b.vbox.volume()
                );
            });
        }
        CMap.prototype = {
            push: function(vbox) {
                this.vboxes.push({
                    vbox: vbox,
                    color: vbox.avg()
                });
            },
            palette: function() {
                return this.vboxes.map(function(vb) {
                    return vb.color;
                });
            },
            size: function() {
                return this.vboxes.size();
            },
            map: function(color) {
                var vboxes = this.vboxes;
                for (var i = 0; i < vboxes.size(); i++) {
                    if (vboxes.peek(i).vbox.contains(color)) {
                        return vboxes.peek(i).color;
                    }
                }
                return this.nearest(color);
            },
            nearest: function(color) {
                var vboxes = this.vboxes,
                    d1, d2, pColor;
                for (var i = 0; i < vboxes.size(); i++) {
                    d2 = Math.sqrt(
                        Math.pow(color[0] - vboxes.peek(i).color[0], 2) +
                        Math.pow(color[1] - vboxes.peek(i).color[1], 2) +
                        Math.pow(color[2] - vboxes.peek(i).color[2], 2)
                    );
                    if (d2 < d1 || d1 === undefined) {
                        d1 = d2;
                        pColor = vboxes.peek(i).color;
                    }
                }
                return pColor;
            },
            forcebw: function() {
                // XXX: won't  work yet
                var vboxes = this.vboxes;
                vboxes.sort(function(a, b) {
                    return pv.naturalOrder(pv.sum(a.color), pv.sum(b.color));
                });

                // force darkest color to black if everything < 5
                var lowest = vboxes[0].color;
                if (lowest[0] < 5 && lowest[1] < 5 && lowest[2] < 5)
                    vboxes[0].color = [0, 0, 0];

                // force lightest color to white if everything > 251
                var idx = vboxes.length - 1,
                    highest = vboxes[idx].color;
                if (highest[0] > 251 && highest[1] > 251 && highest[2] > 251)
                    vboxes[idx].color = [255, 255, 255];
            }
        };

        // histo (1-d array, giving the number of pixels in
        // each quantized region of color space), or null on error
        function getHisto(pixels) {
            var histosize = 1 << (3 * sigbits),
                histo = new Array(histosize),
                index, rval, gval, bval;
            pixels.forEach(function(pixel) {
                rval = pixel[0] >> rshift;
                gval = pixel[1] >> rshift;
                bval = pixel[2] >> rshift;
                index = getColorIndex(rval, gval, bval);
                histo[index] = (histo[index] || 0) + 1;
            });
            return histo;
        }

        function vboxFromPixels(pixels, histo) {
            var rmin = 1000000,
                rmax = 0,
                gmin = 1000000,
                gmax = 0,
                bmin = 1000000,
                bmax = 0,
                rval, gval, bval;
            // find min/max
            pixels.forEach(function(pixel) {
                rval = pixel[0] >> rshift;
                gval = pixel[1] >> rshift;
                bval = pixel[2] >> rshift;
                if (rval < rmin) rmin = rval;
                else if (rval > rmax) rmax = rval;
                if (gval < gmin) gmin = gval;
                else if (gval > gmax) gmax = gval;
                if (bval < bmin) bmin = bval;
                else if (bval > bmax) bmax = bval;
            });
            return new VBox(rmin, rmax, gmin, gmax, bmin, bmax, histo);
        }

        function medianCutApply(histo, vbox) {
            if (!vbox.count()) return;

            var rw = vbox.r2 - vbox.r1 + 1,
                gw = vbox.g2 - vbox.g1 + 1,
                bw = vbox.b2 - vbox.b1 + 1,
                maxw = pv.max([rw, gw, bw]);
            // only one pixel, no split
            if (vbox.count() == 1) {
                return [vbox.copy()];
            }
            /* Find the partial sum arrays along the selected axis. */
            var total = 0,
                partialsum = [],
                lookaheadsum = [],
                i, j, k, sum, index;
            if (maxw == rw) {
                for (i = vbox.r1; i <= vbox.r2; i++) {
                    sum = 0;
                    for (j = vbox.g1; j <= vbox.g2; j++) {
                        for (k = vbox.b1; k <= vbox.b2; k++) {
                            index = getColorIndex(i, j, k);
                            sum += (histo[index] || 0);
                        }
                    }
                    total += sum;
                    partialsum[i] = total;
                }
            } else if (maxw == gw) {
                for (i = vbox.g1; i <= vbox.g2; i++) {
                    sum = 0;
                    for (j = vbox.r1; j <= vbox.r2; j++) {
                        for (k = vbox.b1; k <= vbox.b2; k++) {
                            index = getColorIndex(j, i, k);
                            sum += (histo[index] || 0);
                        }
                    }
                    total += sum;
                    partialsum[i] = total;
                }
            } else { /* maxw == bw */
                for (i = vbox.b1; i <= vbox.b2; i++) {
                    sum = 0;
                    for (j = vbox.r1; j <= vbox.r2; j++) {
                        for (k = vbox.g1; k <= vbox.g2; k++) {
                            index = getColorIndex(j, k, i);
                            sum += (histo[index] || 0);
                        }
                    }
                    total += sum;
                    partialsum[i] = total;
                }
            }
            partialsum.forEach(function(d, i) {
                lookaheadsum[i] = total - d;
            });

            function doCut(color) {
                var dim1 = color + '1',
                    dim2 = color + '2',
                    left, right, vbox1, vbox2, d2, count2 = 0;
                for (i = vbox[dim1]; i <= vbox[dim2]; i++) {
                    if (partialsum[i] > total / 2) {
                        vbox1 = vbox.copy();
                        vbox2 = vbox.copy();
                        left = i - vbox[dim1];
                        right = vbox[dim2] - i;
                        if (left <= right)
                            d2 = Math.min(vbox[dim2] - 1, ~~(i + right / 2));
                        else d2 = Math.max(vbox[dim1], ~~(i - 1 - left / 2));
                        // avoid 0-count boxes
                        while (!partialsum[d2]) d2++;
                        count2 = lookaheadsum[d2];
                        while (!count2 && partialsum[d2 - 1]) count2 = lookaheadsum[--d2];
                        // set dimensions
                        vbox1[dim2] = d2;
                        vbox2[dim1] = vbox1[dim2] + 1;
                        //                    console.log('vbox counts:', vbox.count(), vbox1.count(), vbox2.count());
                        return [vbox1, vbox2];
                    }
                }

            }
            // determine the cut planes
            return maxw == rw ? doCut('r') :
                maxw == gw ? doCut('g') :
                doCut('b');
        }

        function quantize(pixels, maxcolors) {
            // short-circuit
            if (!pixels.length || maxcolors < 2 || maxcolors > 256) {
                //            console.log('wrong number of maxcolors');
                return false;
            }

            // XXX: check color content and convert to grayscale if insufficient

            var histo = getHisto(pixels),
                histosize = 1 << (3 * sigbits);

            // check that we aren't below maxcolors already
            var nColors = 0;
            histo.forEach(function() {
                nColors++;
            });
            if (nColors <= maxcolors) {
                // XXX: generate the new colors from the histo and return
            }

            // get the beginning vbox from the colors
            var vbox = vboxFromPixels(pixels, histo),
                pq = new PQueue(function(a, b) {
                    return pv.naturalOrder(a.count(), b.count());
                });
            pq.push(vbox);

            // inner function to do the iteration
            function iter(lh, target) {
                var ncolors = 1,
                    niters = 0,
                    vbox;
                while (niters < maxIterations) {
                    vbox = lh.pop();
                    if (!vbox.count()) { /* just put it back */
                        lh.push(vbox);
                        niters++;
                        continue;
                    }
                    // do the cut
                    var vboxes = medianCutApply(histo, vbox),
                        vbox1 = vboxes[0],
                        vbox2 = vboxes[1];

                    if (!vbox1) {
                        //                    console.log("vbox1 not defined; shouldn't happen!");
                        return;
                    }
                    lh.push(vbox1);
                    if (vbox2) { /* vbox2 can be null */
                        lh.push(vbox2);
                        ncolors++;
                    }
                    if (ncolors >= target) return;
                    if (niters++ > maxIterations) {
                        //                    console.log("infinite loop; perhaps too few pixels!");
                        return;
                    }
                }
            }

            // first set of colors, sorted by population
            iter(pq, fractByPopulations * maxcolors);

            // Re-sort by the product of pixel occupancy times the size in color space.
            var pq2 = new PQueue(function(a, b) {
                return pv.naturalOrder(a.count() * a.volume(), b.count() * b.volume());
            });
            while (pq.size()) {
                pq2.push(pq.pop());
            }

            // next set - generate the median cuts using the (npix * vol) sorting.
            iter(pq2, maxcolors - pq2.size());

            // calculate the actual colors
            var cmap = new CMap();
            while (pq2.size()) {
                cmap.push(pq2.pop());
            }

            return cmap;
        }

        return {
            quantize: quantize
        };
    })();

    /**
     * Export class to global
     */
    if (typeof define === 'function' && define.amd) {
        define([], function() {
            return ColorThief;
        }); // for AMD loader
    } else if (typeof exports === 'object') {
        module.exports = ColorThief; // for CommonJS
    } else {
        this.ColorThief = ColorThief;
    }
}.call(this));
