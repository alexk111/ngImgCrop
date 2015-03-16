'use strict';

crop.directive('imgCrop', ['$timeout', 'cropHost', 'cropPubSub', function($timeout, CropHost, CropPubSub) {
  return {
    restrict: 'E',
    scope: {
      image: '=',
      resultImage: '=',

      changeOnFly: '=',
      areaType: '@',
      areaMinSize: '=',
      resultImageSize: '=',
      resultImageFormat: '@',
      resultImageQuality: '=',

      onChange: '&',
      onAreaChange: '&',
      onLoadBegin: '&',
      onLoadDone: '&',
      onLoadError: '&'
    },
    template: '<canvas></canvas>',
    controller: ['$scope', function($scope) {
      $scope.events = new CropPubSub();
    }],
    link: function(scope, element/*, attrs*/) {
      // Init Events Manager
      var events = scope.events;

      // Init Crop Host
      var cropHost=new CropHost(element.find('canvas'), {}, events);

      // Store Result Image to check if it's changed
      var storedResultImage;

      var updateResultImage=function(scope) {
        var resultImage=cropHost.getResultImageDataURI();
        if(storedResultImage!==resultImage) {
          storedResultImage=resultImage;
          if(angular.isDefined(scope.resultImage)) {
            scope.resultImage=resultImage;
          }
          scope.onChange({$dataURI: scope.resultImage});
        }
      };

      // Wrapper to safely exec functions within $apply on a running $digest cycle
      var fnSafeApply=function(fn) {
        return function(){
          var args = Array.prototype.slice.call(arguments);
          $timeout(function(){
            scope.$apply(function(scope){
              fn.apply(scope, args);
            });
          });
        };
      };

      // Setup CropHost Event Handlers
      events
        .on('load-start', fnSafeApply(function(){
          this.onLoadBegin({});
        }))
        .on('load-done', fnSafeApply(function(){
          this.onLoadDone({});
        }))
        .on('load-error', fnSafeApply(function(){
          this.onLoadError({});
        }))
        .on('area-init', fnSafeApply(function(area){
          var resizeEvent = {
            x: area._x,
            y: area._y,
            size: area._size,
            image: {
              width: area._ctx.canvas.width,
              height: area._ctx.canvas.height,
            }
          };

          this.onAreaChange({$event:resizeEvent});
        }))
        .on('area-move area-resize', fnSafeApply(function( area ){

          var resizeEvent = {
            x: area._x,
            y: area._y,
            size: area._size,
            image: {
              width: area._ctx.canvas.width,
              height: area._ctx.canvas.height,
            }
          };

          this.onAreaChange({$event:resizeEvent});

          if(!!this.changeOnFly) {
            updateResultImage(this);
          }
        }))
        .on('area-move-end area-resize-end image-updated', fnSafeApply(function(){
          updateResultImage(this);
        }));

      // Sync CropHost with Directive's options
      scope.$watch('image',function(){
        cropHost.setNewImageSource(scope.image);
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
      scope.$watch('resultImageFormat',function(){
        cropHost.setResultImageFormat(scope.resultImageFormat);
        updateResultImage(scope);
      });
      scope.$watch('resultImageQuality',function(){
        cropHost.setResultImageQuality(scope.resultImageQuality);
        updateResultImage(scope);
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