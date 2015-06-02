(function()
{
    "use strict";


    var module = angular.module('functal.controllers', []);

    module.controller('ImagesCtrl', ['functalData', '$interval', '$scope', '$ionicScrollDelegate',
        function(functalData, $interval, $scope, $ionicScrollDelegate)
        {
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

            $scope.gotoTop = function()
            {
                $window.location.href = '#top';
            };

            $scope.showMore = function()
            {
                $scope.showCount += 4;

                console.log('showmore', $scope.showCount);

                $scope.$broadcast('scroll.infiniteScrollComplete');
            };

            $scope.sortBy = function(sorter)
            {
                $scope.sorter = sorter;

                sort();

                $scope.showCount = 6;

                $ionicScrollDelegate.scrollTop();
            };

            // reload

            $interval(function()
            {
                getImages();
            }, 5 * 60000);

            // init

            $scope.cdn = 'https://d1aienjtp63qx3.cloudfront.net/';
            $scope.s3 = 'https://s3.amazonaws.com/functal-images/';

            $scope.showCount = 6;

            $scope.sorter = 'shuffle';

            $scope.images = [];

            getImages();

            // ---------------- save to camera roll

            $scope.save = function(image)
            {
                image.status = 'saving to your photos...';

                // todo - keep testing with cdn to see if cors overcome
                var url = $scope.s3 + image.name;

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
            };

            /**
             * Convert an image
             * to a base64 url
             * @param  {String}   url
             * @param  {Function} callback
             * @param  {String}   [outputFormat=image/jpeg]
             * http://stackoverflow.com/questions/6150289/how-to-convert-image-into-base64-string-using-javascript
             */
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
        }
    ]);
})();
