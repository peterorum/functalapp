(function()
{
    "use strict";


    var module = angular.module('functal.controllers', []);

    module.controller('ImagesCtrl', ['functalData', '$interval', '$scope', '$ionicScrollDelegate',
        function(functalData, $interval, $scope, $ionicScrollDelegate)
        {
            //--- get images

            var getImages = function()
            {
                functalData.getImages().then(function(result)
                {
                    $scope.images = R.map(function(i)
                    {
                        return {
                            name: i
                        };
                    }, result.data.images);
                    sort();
                });
            };

            //--- reload 5 minutes since last action

            var resetReloader = function()
            {
                if ($scope.reloadTimer)
                {
                    $interval.cancel($scope.reloadTimer);
                }

                $scope.reloadTimer = $interval(function()
                {
                    console.log('reload');

                    getImages();
                }, 5 * 60000);
            };

            //--- sort

            var sort = function()
            {
                $scope.images = R.sort(function(a, b)
                {
                    switch ($scope.sorter)
                    {
                        case 'asc':
                            {
                                return -(b > a ? 1 : b < a ? -1 : 0);
                            }

                        case 'desc':
                            {
                                return (b > a ? 1 : b < a ? -1 : 0);
                            }

                        case 'shuffle':
                            {
                                return Math.random() < 0.5 ? -1 : 1;
                            }
                    }

                }, $scope.images);
            };

            //--- goto top of screen

            $scope.gotoTop = function()
            {
                $window.location.href = '#top';

                resetReloader();

            };

            //--- infinite scroll

            $scope.showMore = function()
            {
                $scope.showCount += 4;

                console.log('showmore', $scope.showCount);

                $scope.$broadcast('scroll.infiniteScrollComplete');

                resetReloader();
            };

            //--- user sort

            $scope.sortBy = function(sorter)
            {
                $scope.sorter = sorter;

                sort();

                $scope.showCount = 6;

                $ionicScrollDelegate.scrollTop();

                resetReloader();

            };

            // ---------------- save to camera roll

            $scope.save = function(image)
            {
                image.status = 'saving to your photos...';

                var url = $scope.cdn + image.name;

                convertImgToBase64URL(url, function(base64DataURL)
                {
                    CameraRoll.saveToCameraRoll(base64DataURL, function()
                    {
                        image.status = 'saved';
                        $scope.$apply();

                    }, function(err)
                    {
                        image.status = 'Error : ' + err;
                        $scope.$apply();

                    });
                }, 'image/jpeg');

                resetReloader();

            };

            /**
             * Convert an image
             * to a base64 url
             * @param  {String}   url
             * @param  {Function} callback
             * @param  {String}   [outputFormat=image/jpeg]
             * http://stackoverflow.com/questions/6150289/how-to-convert-image-into-base64-string-using-javascript
             */

             // cors test example
             // curl -sI -H "Origin: codeindeed.com" -H "Access-Control-Request-Method: GET" https://d1aienjtp63qx3.cloudfront.net/functal-20150610070410687.jpg

            function convertImgToBase64URL(url, callback, outputFormat)
            {
                var img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = function()
                {
                    var canvas = document.createElement('CANVAS'),
                        ctx = canvas.getContext('2d'),
                        dataURL;
                    canvas.height = img.height;
                    canvas.width = img.width;
                    ctx.drawImage(img, 0, 0);
                    dataURL = canvas.toDataURL(outputFormat);
                    callback(dataURL);
                    canvas = null;
                };
                img.src = url;
            }

            //----------------- init

            $scope.cdn = 'https://d1aienjtp63qx3.cloudfront.net/';

            $scope.showCount = 6;

            $scope.sorter = 'shuffle';

            $scope.images = [];

            getImages();

            resetReloader();
        }
    ]);
})();
