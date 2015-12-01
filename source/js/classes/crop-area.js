'use strict';

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
