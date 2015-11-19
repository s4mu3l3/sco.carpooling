angular.module('carpooling.services.config', [])

.factory('Config', function ($http, $q, $filter) {
    var SERVER_URL = 'https://dev.smartcommunitylab.it/carpooling';
    var GEOCODER_URL = 'https://os.smartcommunitylab.it/core.geocoder/spring';

    var HTTP_CONFIG = {
        timeout: 5000
    };

    var ttJsonConfig = null;
    var DISTANCE_AUTOCOMPLETE = '6';
    var LAT = 46.069672;
    var LON = 11.121270;
    var ZOOM = 15;

    return {
        getServerURL: function () {
            return SERVER_URL;
        },
        getGeocoderURL: function() {
            return GEOCODER_URL;
        },
        getHTTPConfig: function () {
            return HTTP_CONFIG;
        },
        getLat: function () {
            return LAT;
        },
        getLon: function () {
            return LON;
        },
        getZoom: function () {
            return ZOOM;
        },
        getDistanceForAutocomplete: function () {
            return DISTANCE_AUTOCOMPLETE;
        },
        init: function () {
            /*
            var deferred = $q.defer();

            $http.get(Config.getServerURL()() + '/getparkingsbyagency/' + agencyId, Config.getHTTPConfig())

            .success(function (data) {
                deferred.resolve(data);
            })

            .error(function (err) {
                deferred.reject(err);
            });

            return deferred.promise;
            */
        }
    }
});
