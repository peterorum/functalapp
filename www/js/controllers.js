(function()
{
    "use strict";


    var module = angular.module('functal.controllers', []);

    module.controller('ImagesCtrl', ['functalData', '$interval', '$scope', function(functalData, $interval, $scope)
    {
        var getImages = function()
        {
            functalData.getImages().then(function(result)
            {
                $scope.images = result.data.images;
            });
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

        // reload

        $interval(function()
        {
            getImages();
        }, 5 * 60000);

        // init

        $scope.cdn = 'https://d1aienjtp63qx3.cloudfront.net/';

        $scope.showCount = 6;

        getImages();

    }]);
})();
