(function() {
    "use strict";

    // add to Daily Functal-info.plist

    /*

      <key>NSAppTransportSecurity</key>
      <dict>
        <key>NSExceptionDomains</key>
        <dict>
          <key>codeindeed.com</key>
          <dict>
            <key>NSIncludesSubdomains</key>
            <true/>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
          </dict>
        </dict>
      </dict>

    */

    var module = angular.module('functal.services', []);

    module.factory('functalData', ['$http', '$q', function($http, $q) {
        var functalData = {};

        functalData.server = 'http://functalserver.codeindeed.com:8083';
        // functalData.server = 'http://localhost:8083';

        functalData.getImages = function(count, sortBy) {
            count = count || 0;

            return $http.jsonp(functalData.server + '/getimages?callback=JSON_CALLBACK',
                {
                    params: {
                        data: {
                            count: count,
                            sortBy: sortBy
                        }
                    }
                });
        };

        functalData.setImageCount = function(count) {
            functalData.imageCount = count;
        };

        functalData.vote = function(image, like, dislike) {
            return $http.jsonp(functalData.server + '/vote?callback=JSON_CALLBACK',
                {
                    params: {
                        data: {
                            name: image.name,
                            like: like,
                            dislike: dislike
                        }
                    }
                });
        };

        return functalData;
    }]);
})();
