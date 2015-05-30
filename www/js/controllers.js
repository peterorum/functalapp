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
                    $scope.images = result.data.images;
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

            $scope.showCount = 6;

            $scope.sorter = 'shuffle';

            getImages();
        }
    ]);
})();
