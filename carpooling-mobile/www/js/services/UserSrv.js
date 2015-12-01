angular.module('carpooling.services.user', [])

.factory('UserSrv', function ($http, $q, Config) {

    var isMessageValid = function (message) {
        if (!!message && !!message.userId && !!message.timestamp && !!message.message && !!message.targetUserId) {
            return true;
        }
        return false;
    };

    return {
        getTravelProfile: function () {
            var deferred = $q.defer();

            $http.get(Config.getServerURL() + '/api/read/profile', Config.getHTTPConfig())

            .success(function (data) {
                if (data[0] == '<') {
                    deferred.reject();
                } else {
                    deferred.resolve(data);
                }
            })

            .error(function (err) {
                deferred.reject(err);
            });

            return deferred.promise;
        },
        saveTravelProfile: function (travelProfile) {
            var deferred = $q.defer();

            if (!!!travelProfile) {
                deferred.reject('Invalid travelProfile');
            } else {
                $http.post(Config.getServerURL() + '/api/save/profile', travelProfile, Config.getHTTPConfig())

                .success(function (data) {
                    deferred.resolve(data);
                })

                .error(function (err) {
                    deferred.reject(err);
                });
            }

            return deferred.promise;
        },
        saveAuto: function (auto) {
            var deferred = $q.defer();

            $http.post(Config.getServerURL() + '/api/save/autoInfo/' + auto, Config.getHTTPConfig())

            .success(function (data) {
                deferred.resolve(data);
            })

            .error(function (err) {
                deferred.reject(err);
            });

            return deferred.promise;
        },
        getCommunities: function () {
            var deferred = $q.defer();

            $http.get(Config.getServerURL() + '/api/read/communities', Config.getHTTPConfig())

            .success(function (data) {
                deferred.resolve(data);
            })

            .error(function (err) {
                deferred.reject(err);
            });

            return deferred.promise;
        },
        getDiscussion: function (travelId, targetUserId) {
            var deferred = $q.defer();

            $http.get(Config.getServerURL() + '/api/read/' + travelId + '/' + targetUserId + '/discussion', Config.getHTTPConfig())

            .success(function (data) {
                deferred.resolve(data);
            })

            .error(function (err) {
                deferred.reject(err);
            });

            return deferred.promise;
        },
        sendMessage: function (travelId, message) {
            var deferred = $q.defer();

            if (!!!travelId) {
                deferred.reject('Invalid travelId');
            } else if (!(isMessageValid(message))) {
                deferred.reject('Invalid message');
            } else {
                $http.get(Config.getServerURL() + '/api/message/' + travelId + '/send', message, Config.getHTTPConfig())

                .success(function (data) {
                    deferred.resolve(data);
                })

                .error(function (err) {
                    deferred.reject(err);
                });
            }

            return deferred.promise;
        }
    }
});
