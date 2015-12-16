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

'use strict';
