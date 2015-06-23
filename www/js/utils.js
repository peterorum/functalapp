(function()
{
    "use strict";

    var module = angular.module('ionic.utils', []);

    module.factory('$localStorage', ['$window', function($window)
    {
        return {
            set: function(key, value)
            {
                $window.localStorage[key] = value;
            },
            get: function(key, defaultValue)
            {
                return $window.localStorage[key] || defaultValue;
            },
            setObject: function(key, value)
            {
                $window.localStorage[key] = JSON.stringify(value);
            },
            getObject: function(key, defaultObject)
            {
                var obj = $window.localStorage[key];

                if (obj)
                {
                    obj = JSON.parse($window.localStorage[key]);
                }
                else
                {
                    obj = defaultObject;
                }

                return obj;
            }
        };
    }]);

    module.factory('$debounce', [function()
    {
        var debounce = {
            // from underscore
            debounce: function(func, wait, immediate)
            {
                // if immediate is true, then func is called straight away subsequent calls are ignored until called after idle of wait msecs
                // if immediate is false, func is called after wait msecs of idle

                var timeout;

                return function()
                {
                    var context = this;
                    var args = arguments;

                    var later = function()
                    {
                        timeout = null;

                        if (!immediate)
                        {
                            func.apply(context, args);
                        }
                    };

                    var callNow = immediate && !timeout;

                    clearTimeout(timeout);

                    timeout = setTimeout(later, wait);

                    if (callNow)
                    {
                        func.apply(context, args);
                    }
                };
            }
        };

        return debounce;
    }]);



})();
