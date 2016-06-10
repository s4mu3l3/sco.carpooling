angular.module('carpooling.controllers.cercaviaggi', [])

.controller('CercaViaggioCtrl', function ($scope, $q, $http, $ionicModal, $ionicLoading, $filter, $state, $window, Config, Utils, PlanSrv, GeoSrv, MapSrv, $ionicPopup, PassengerSrv) {
    $scope.formTravelRequest = {
        'from': {
            'name': '',
            'address': '',
            'latitude': null,
            'longitude': null,
            'range': 5
        },
        'to': {
            'name': '',
            'address': '',
            'latitude': null,
            'longitude': null,
            'range': 5
        },
        'when': 0,
        'monitored': false
    };

    $scope.travelRequest = angular.copy($scope.formTravelRequest);

    $scope.equalFormAndTravelRequestFields = {
        'from': false,
        'to': false
    };

    // FUTURE communities are not used right now in client-side search
    $scope.communities = {
        enabled: false,
        useMyCommunities: false
    };

    /*
     * Autocompletion stuff
     */
    // names: array with the names of the places
    // coordinates: object that maps a place name with an object that has its coordinate in key 'latlng'
    $scope.afterMapSelection = false;

    $scope.places = {
        from: {
            'names': [],
            'coordinates': {}
        },
        to: {
            'names': [],
            'coordinates': {}
        }
    };

    var typing = function (field, typedthings) {
        if ($scope.afterMapSelection) {
            $scope.afterMapSelection = false;
            return;
        }

        $scope.equalFormAndTravelRequestFields[field] = Utils.fastCompareObjects($scope.formTravelRequest[field], $scope.travelRequest[field]);
        if ($scope.equalFormAndTravelRequestFields[field]) {
            return;
        } else {
            if (!!$scope.formTravelRequest[field]['address']) {
                $scope.formTravelRequest[field]['address'] = '';
            }
            if (!!$scope.formTravelRequest[field]['latitude']) {
                $scope.formTravelRequest[field]['latitude'] = null;
            }
            if (!!$scope.formTravelRequest[field]['longitude']) {
                $scope.formTravelRequest[field]['longitude'] = null;
            }
        }

        var newPlaces = PlanSrv.getTypedPlaces(typedthings);
        newPlaces.then(function (data) {
            // merge with favorites and check no double values
            $scope.places[field].names = data;
            $scope.places[field].coordinates = PlanSrv.getNames();
        });
    };

    $scope.typingFrom = function (typedthings) {
        typing('from', typedthings);
    };

    $scope.typingTo = function (typedthings) {
        typing('to', typedthings);
    };

    var setLocation = function (field, name) {
        $scope.formTravelRequest[field].name = name;
        $scope.formTravelRequest[field].address = name;
        var coordinates = $scope.places[field].coordinates[name].latlng.split(',');
        $scope.formTravelRequest[field].latitude = parseFloat(coordinates[0]);
        $scope.formTravelRequest[field].longitude = parseFloat(coordinates[1]);

        $scope.travelRequest = angular.copy($scope.formTravelRequest);

        $scope.places[field] = {
            'names': [],
            'coordinates': {}
        };
    };

    $scope.setLocationFrom = function (name) {
        setLocation('from', name);
    };

    $scope.setLocationTo = function (name) {
        setLocation('to', name);
    };

    /*
     * Map stuff
     */
    var mapId = 'modalMap';
    var selectedField = null;

    $scope.modalMap = null;

    angular.extend($scope, {
        center: {
            lat: Config.getLat(),
            lng: Config.getLon(),
            zoom: Config.getZoom()
        },
        defaults: {
            scrollWheelZoom: false
        },
        events: {}
    });

    // Modal Map
    $ionicModal.fromTemplateUrl('templates/modal_map.html', {
        id: '1',
        scope: $scope,
        backdropClickToClose: true,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modalMap = modal;
    });

    $scope.initMap = function () {
        MapSrv.initMap(mapId).then(function () {
            $scope.$on('leafletDirectiveMap.' + mapId + '.click', function (event, args) {
                $ionicLoading.show();

                var confirmPopup = null;
                var confirmPopupOptions = {
                    title: $filter('translate')('modal_map_confirm'),
                    template: '',
                    buttons: [
                        {
                            text: $filter('translate')('cancel'),
                            type: 'button'
                        },
                        {
                            text: $filter('translate')('ok'),
                            type: 'button-carpooling'
                        }
                    ]
                };

                var fillConfirmPopupOptions = function (name, coordinates) {
                    confirmPopupOptions.template = name;
                    confirmPopupOptions.buttons[1].onTap = function () {
                        if (!!selectedField) {
                            $scope.formTravelRequest[selectedField].name = name;
                            $scope.formTravelRequest[selectedField].address = name;
                            var splittedCoords = coordinates.split(',');
                            $scope.formTravelRequest[selectedField].latitude = parseFloat(splittedCoords[0]);
                            $scope.formTravelRequest[selectedField].longitude = parseFloat(splittedCoords[1]);
                            $scope.afterMapSelection = true;

                            $scope.travelRequest = angular.copy($scope.formTravelRequest);

                            $scope.equalFormAndTravelRequestFields[selectedField] = Utils.fastCompareObjects($scope.formTravelRequest[selectedField], $scope.travelRequest[selectedField]);
                        }
                        $scope.hideModalMap();
                    };
                };

                GeoSrv.geolocate([args.leafletEvent.latlng.lat, args.leafletEvent.latlng.lng]).then(
                    function (data) {
                        $ionicLoading.hide();
                        var placeName = '';
                        var coordinates = '';

                        if (!!data.response.docs[0]) {
                            placeName = PlanSrv.generatePlaceString(data.response.docs[0]);
                            coordinates = data.response.docs[0].coordinate;
                        } else {
                            placeName = args.leafletEvent.latlng.lat + ',' + args.leafletEvent.latlng.lng;
                            coordinates = args.leafletEvent.latlng.lat + ',' + args.leafletEvent.latlng.lng;
                        }

                        fillConfirmPopupOptions(placeName, coordinates);
                        confirmPopup = $ionicPopup.confirm(confirmPopupOptions);
                        console.log(placeName + ' (' + coordinates + ')');
                    },
                    function (err) {
                        $ionicLoading.hide();
                        var placeName = args.leafletEvent.latlng.lat + ',' + args.leafletEvent.latlng.lng;
                        var coordinates = args.leafletEvent.latlng.lat + ',' + args.leafletEvent.latlng.lng;
                        fillConfirmPopupOptions(placeName, coordinates);
                        confirmPopup = $ionicPopup.confirm(confirmPopupOptions);
                        console.log(placeName + ' (' + coordinates + ')');
                    }
                );
            });
        });
    };

    $scope.showModalMap = function (field) {
        selectedField = field;

        $scope.modalMap.show().then(function () {
            // resize map!
            var modalMapElement = document.getElementById('modal-map-container');
            if (modalMapElement != null) {
                MapSrv.resizeElementHeight(modalMapElement, mapId);
                MapSrv.refresh(mapId);
            }
        });
    };

    $scope.hideModalMap = function () {
        $scope.modalMap.hide();
    };

    /*
     * Recurrence popup stuff
     */
    /* Date Picker */
    $scope.dateMask = 'dd MMMM yyyy';
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var nextMonth = angular.copy(today);;
    nextMonth.setHours(+(24 * 29));

    $scope.datepickerObj = {
        titleLabel: $filter('translate')('popup_datepicker_title'),
        todayLabel: $filter('translate')('popup_datepicker_today'),
        closeLabel: $filter('translate')('cancel'),
        setLabel: $filter('translate')('ok'),
        errorMsgLabel: null,
        setButtonType: 'button-carpooling',
        //todayButtonType: 'button-carpooling',
        todayButtonType: 'ng-hide',
        closeButtonType: '',
        templateType: 'popup',
        showTodayButton: 'false',
        modalHeaderColor: '',
        modalFooterColor: '',
        from: today,
        //to: new Date(2019, 12, 31, 23, 59, 59),
        to: nextMonth,
        inputDate: today,
        weekDaysList: Utils.getSDoWList(),
        monthList: Utils.getMonthList(),
        mondayFirst: true,
        disableDates: null,
        callback: function (val) { //Mandatory
            if (typeof (val) === 'undefined') {
                console.log('[datepicker] Date not selected');
            } else {
                /*console.log('Selected date is : ', val);*/
                $scope.datepickerObj.inputDate = val;
            }
        },
    };

    /* Time Picker */
    var now = new Date();
    $scope.timepickerObj = {
        inputEpochTime: (now.getHours() * 60 * 60) + ((now.getMinutes() - (now.getMinutes() % Config.getClockStep()) + Config.getClockStep()) * 60),
        step: Config.getClockStep(),
        format: 24,
        titleLabel: $filter('translate')('popup_timepicker_title'),
        setLabel: $filter('translate')('ok'),
        closeLabel: $filter('translate')('cancel'),
        setButtonType: 'button-carpooling',
        closeButtonType: '',
        callback: function (val) { //Mandatory
            if (typeof (val) === 'undefined') {
                console.log('[timepicker] Time not selected');
            } else {
                $scope.timepickerObj.inputEpochTime = val;
            }
        }
    };

    /* Search Trip */
    $scope.searchTravel = function () {
        // NOTE: 'from', 'to' and 'monitored' are already on $scope.travelRequest
        var selectedDateTime = angular.copy($scope.datepickerObj.inputDate);
        selectedDateTime.setSeconds(selectedDateTime.getSeconds() + $scope.timepickerObj.inputEpochTime);
        $scope.travelRequest['when'] = selectedDateTime.getTime();

        if (selectedDateTime.getTime() < (new Date().getTime() - 5 * 60 * 1000)) {
            Utils.toast(($filter('translate')('toast_time_invalid')));
            return;
        }


        Utils.loading();
        PassengerSrv.searchTrip($scope.travelRequest).then(
            function (searchResults) {
                Utils.loaded();
                // console.log('Done trip search');
                $state.go('app.risultaticercaviaggi', {
                    'searchResults': searchResults,
                    'searchParams': $scope.travelRequest
                });
            },
            function (error) {
                Utils.loaded();
                Utils.toast(Utils.getErrorMsg(error));
            }
        );
    };

    $scope.$on('$ionicView.enter', function () {
        //MapSrv.refresh('modalMap');
        $scope.initMap();
    });
})

.controller('RisultatiCercaViaggiCtrl', function ($scope, $state, $stateParams, Utils, PassengerSrv, $filter) {
    $scope.passengerTripsFound = $stateParams['searchResults'];
    $scope.searchParams = $stateParams['searchParams'];
    $scope.travelDateFormat = 'dd MMMM yyyy';
    $scope.travelTimeFormat = 'HH:mm';
    $scope.passengerTripsFound.forEach(function (travel) {
        travel.bookingCounters = Utils.getBookingCounters(travel);
        travel.style = Utils.getTripStyle(travel);
    });

    $scope.selectTrip = function (index) {
        $state.go('app.viaggio', {
            'travelId': $scope.passengerTripsFound[index].id
        });
    };
});
