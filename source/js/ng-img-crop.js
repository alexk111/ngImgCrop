'use strict';

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
