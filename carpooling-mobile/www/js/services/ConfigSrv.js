angular.module('carpooling.services.config', [])

.factory('Config', function ($rootScope, $http, $q, $filter) {
    $rootScope.version = '1.1.0';

    var AAC_URL = 'https://dev.smartcommunitylab.it/aac';
    var SERVER_URL = 'https://dev.smartcommunitylab.it/carpooling';
    var GEOCODER_URL = 'https://os.smartcommunitylab.it/core.geocoder/spring';
    var APPID = 'QZByJ7flOj4rmtN3gpyBhMyw7jONUU3sgzJJT3pL';
    var CLIENTKEY = 'mTCHyDLCaogDtE5IA7g3xM0J0o400j4a8u9Nnc8N';
    var RECURRENCY = true;

    var HTTP_CONFIG = {
        timeout: 5000
    };

    var ttJsonConfig = null;
    var DISTANCE_AUTOCOMPLETE = '25';
    // Rovereto
    var LAT = 45.883238;
    var LON = 11.018961;
    var ZOOM = 12;

    var CLOCK_STEP = 5;

    var RATING_MAX = 5;

    var LOGIN_EXPIRED = 'LOGIN_EXPIRED';

    return {
        getAACURL: function () {
            return AAC_URL;
        },
        getServerURL: function () {
            return SERVER_URL;
        },
        getGeocoderURL: function () {
            return GEOCODER_URL;
        },
        isRecurrencyEnabled: function () {
            return RECURRENCY;
        },
        getHTTPConfig: function () {
            return angular.copy(HTTP_CONFIG);
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
        getClockStep: function () {
            return CLOCK_STEP;
        },
        getRatingMax: function () {
            return RATING_MAX;
        },
        getDistanceForAutocomplete: function () {
            return DISTANCE_AUTOCOMPLETE;
        },
        getAppId: function () {
            return APPID;
        },
        getClientKey: function () {
            return CLIENTKEY;
        },
        LOGIN_EXPIRED: LOGIN_EXPIRED,
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
