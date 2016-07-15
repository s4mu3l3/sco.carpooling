angular.module('carpooling.controllers.home', [])

.controller('AppCtrl', function ($scope, $state, $ionicModal, $ionicSideMenuDelegate) {
   $ionicModal.fromTemplateUrl('templates/modal_credits.html', {
      scope: $scope,
      animation: 'slide-in-up'
   }).then(function (modal) {
      $scope.modalCredits = modal;
   });

   $scope.openCredits = function () {
      $scope.modalCredits.show();
   };

   $scope.closeCredits = function () {
      $scope.modalCredits.hide();
   };

   $scope.toggleLeftSideMenu = function () {
      $ionicSideMenuDelegate.toggleLeft();
   };

   $scope.$watch(function () {
         return $ionicSideMenuDelegate.getOpenRatio();
      },
      function (ratio) {
         if (ratio == 1) {
            for (i in document.getElementsByClassName("item-content")) {
               if (document.getElementsByClassName("item-content")[i].className == "item-content") {
                  document.getElementsByClassName("item-content")[i].setAttribute("aria-hidden", "false");
               }
            }
         } else {
            for (i in document.getElementsByClassName("item-content")) {
               if (document.getElementsByClassName("item-content")[i].className == "item-content") {
                  document.getElementsByClassName("item-content")[i].setAttribute("aria-hidden", "true");
               }
            }
         }
      });

})

.controller('HomeCtrl', function ($scope, $rootScope, $window, $state, $filter, $interval, $ionicPopup, $ionicScrollDelegate, Config, CacheSrv, StorageSrv, DriverSrv, Utils, UserSrv, PassengerSrv, $ionicTabsDelegate, $timeout, $ionicSideMenuDelegate) {

   /* ACCESSIBILITY */

   if ($ionicSideMenuDelegate.isOpen()) {
      alert("Aperto");
   }


   /* document.getElementsByClassName("tab-item-active")[0].checkTab("role", "button");
      document.getElementsByClassName("tab-item")[0].checkTab("role", "button");*/

   $timeout(function () {
      console.log("content loaded");
      document.getElementsByClassName("tab-item")[0].setAttribute("role", "tab");
      document.getElementsByClassName("tab-item")[0].setAttribute("aria-label", "selezionato, i miei viaggi");
      document.getElementsByClassName("tab-item")[1].setAttribute("role", "tab");
      document.getElementsByClassName("tab-item")[1].setAttribute("aria-label", "non selezionato, tutti i viaggi");
      document.getElementsByClassName("tab-title")[0].setAttribute("aria-label", "true");
   });

   /*---------------*/

   $scope.tab = 0;

   $scope.selectTab = function (idx) {
      //if (idx == $scope.tab) return;
      if (idx !== $scope.tab) {
         $scope.tab = idx;
         $ionicTabsDelegate.$getByHandle('tabs-home').select(idx);

         /* ACCESSIBILITY */
         if (idx === 1) {
            document.getElementsByClassName("tab-item")[0].setAttribute("role", "tab");
            document.getElementsByClassName("tab-item")[0].setAttribute("aria-label", "non selezionato, i miei viaggi");
            document.getElementsByClassName("tab-item")[1].setAttribute("role", "tab");
            document.getElementsByClassName("tab-item")[1].setAttribute("aria-label", "selezionato, tutti i viaggi");
         } else {
            document.getElementsByClassName("tab-item")[0].setAttribute("role", "tab");
            document.getElementsByClassName("tab-item")[0].setAttribute("aria-label", "selezionato, i miei viaggi");
            document.getElementsByClassName("tab-item")[1].setAttribute("role", "tab");
            document.getElementsByClassName("tab-item")[1].setAttribute("aria-label", "non selezionato, tutti i viaggi");
         }
         /*---------------*/
      }
   }

   $scope.travelDateFormat = 'dd MMMM yyyy';
   $scope.travelTimeFormat = 'HH:mm';

   $scope.maxItemsPerList = 2;

   $scope.nonConfirmedTrips = CacheSrv.getNonConfirmedTrips();
   $scope.passengerTrips = CacheSrv.getPassengerTrips();
   $scope.driverTrips = CacheSrv.getDriverTrips();

   $scope.emptyPanelHeight = ($window.innerHeight - (44 + 49)) / 2; // navbar, tab bar

   /*
    * Partecipo
    */
   var passengerTripsStart = 0;
   var passengerTripsCount = 20; // default
   $scope.passengerTripsCanHaveMore = false;

   var enrichTrip = function (trip) {
      trip.style = Utils.getTripStyle(trip);

      // booking counters
      trip.bookingCounters = Utils.getBookingCounters(trip);

      // booking state
      if (trip.userId !== StorageSrv.getUserId()) {
         trip.bookings.forEach(function (booking) {
            if (booking.traveller.userId === StorageSrv.getUserId()) {
               // my booking
               trip.bookingState = booking.accepted;
            }
         });
      }
   };

   var errorGettingPassengerTrips = function (error) {
      if (passengerTripsStart === 0) {
         Utils.loaded();
      } else {
         $scope.$broadcast('scroll.infiniteScrollComplete');
      }

      if (error !== Config.LOGIN_EXPIRED) {
         Utils.toast(Utils.getErrorMsg(error));
      }

      if ($scope.passengerTrips === null) {
         $scope.passengerTrips = [];
         CacheSrv.setPassengerTrips($scope.passengerTrips);
      }
   };

   $scope.loadMorePassengerTrips = function (reset) {
      if (passengerTripsStart === 0) {
         Utils.loading();
      }

      if (reset) {
         $scope.passengerTrips = null;
         passengerTripsStart = 0;
         passengerTripsCount = 20; // default
         $scope.passengerTripsCanHaveMore = false;
      }

      // read trips to confirm
      // FUTURE use CacheSrv for these trips too?
      PassengerSrv.getPassengerTrips(0, 100, false, true).then(
         function (toConfirm) {
            //toConfirm = []; // test only
            $scope.nonConfirmedTrips = toConfirm;
            CacheSrv.setNonConfirmedTrips($scope.nonConfirmedTrips);
            if (passengerTripsStart === 0) {
               Utils.loaded();
            } else {
               $scope.$broadcast('scroll.infiniteScrollComplete');
            }
         },
         errorGettingPassengerTrips
      );

      // read future trips
      PassengerSrv.getPassengerTrips(passengerTripsStart, passengerTripsCount, true).then(
         function (trips) {
            //trips = []; // test only
            CacheSrv.setReloadPassengerTrips(false);

            trips.forEach(function (trip) {
               enrichTrip(trip);
            });

            if (passengerTripsStart === 0) {
               Utils.loaded();
            } else {
               $scope.$broadcast('scroll.infiniteScrollComplete');
            }

            $scope.passengerTrips = !!$scope.passengerTrips ? $scope.passengerTrips.concat(trips) : trips;
            CacheSrv.setPassengerTrips($scope.passengerTrips);

            if (trips.length === passengerTripsCount) {
               $scope.passengerTripsCanHaveMore = true;
               passengerTripsStart++;
            } else {
               $scope.passengerTripsCanHaveMore = false;
            }
         },
         errorGettingPassengerTrips
      );
   };

   var doConfirm = function ($index, confirm) {
      Utils.loading();
      PassengerSrv.confirmTrip($scope.nonConfirmedTrips[$index].id, confirm).then(function () {
         Utils.loaded();
         $scope.nonConfirmedTrips.splice($index, 1);
         CacheSrv.setNonConfirmedTrips($scope.nonConfirmedTrips);
      }, function (error) {
         Utils.loaded();
         Utils.toast(Utils.getErrorMsg(error));
      });
   };

   $scope.confirmDialog = function ($index) {
      document.getElementsByClassName("my-passenger")[0].setAttribute("aria-label", "modale aperto");
      document.getElementsByClassName("my-passenger")[0].setAttribute("role", "alert");
      var confirmPopup = $ionicPopup.show({
         title: $filter('translate')('popup_confirm_boarding'),
         template: $filter('translate')('popup_confirm_boarding_body'),
         buttons: [
            {
               text: $filter('translate')('cancel'),
               //type: 'button-stable',
               onTap: function (event) {}
                },
            {
               text: $filter('translate')('no'),
               type: 'button-carpooling',
               onTap: function (event) {
                  doConfirm($index, false);
               }
                },
            {
               text: $filter('translate')('yes'),
               type: 'button-carpooling',
               onTap: function (event) {
                  doConfirm($index, true);
               }
                }
            ]
      });
      confirmPopup.then(function () {
         document.getElementsByClassName("my-passenger")[0].setAttribute("aria-label", "modale chiuso");
         document.getElementsByClassName("my-passenger")[0].setAttribute("role", "alert");
      });
   };

   $scope.selectParticipatedTrip = function (index, coll) {
      $state.go('app.viaggio', {
         'travelId': coll[index].id
      });
   };

   /*
    * Offro
    */
   var driverTripsStart = 0;
   var driverTripsCount = 20; // default
   $scope.driverTripsCanHaveMore = false;

   $scope.loadMoreDriverTrips = function (reset) {
      if (driverTripsStart === 0) {
         Utils.loading();
      }

      if (reset) {
         $scope.driverTrips = null;
         CacheSrv.setDriverTrips($scope.driverTrips);
         driverTripsStart = 0;
         driverTripsCount = 20;
         $scope.driverTripsCanHaveMore = false;
      }

      DriverSrv.getDriverTrips(driverTripsStart, driverTripsCount, true).then(
         function (trips) {
            //trips = []; // test only
            CacheSrv.setReloadDriverTrips(false);

            trips.forEach(function (trip) {
               enrichTrip(trip);
            });

            if (driverTripsStart === 0) {
               Utils.loaded();
            } else {
               $scope.$broadcast('scroll.infiniteScrollComplete');
            }

            $scope.driverTrips = !!$scope.driverTrips ? $scope.driverTrips.concat(trips) : trips;
            CacheSrv.setDriverTrips($scope.driverTrips);

            if (trips.length === driverTripsCount) {
               $scope.driverTripsCanHaveMore = true;
               driverTripsStart++;
            } else {
               $scope.driverTripsCanHaveMore = false;
            }
         },
         function (error) {
            if (driverTripsStart === 0) {
               Utils.loaded();
            } else {
               $scope.$broadcast('scroll.infiniteScrollComplete');
            }

            if (error !== Config.LOGIN_EXPIRED) {
               Utils.toast(Utils.getErrorMsg(error));
            }

            if ($scope.driverTrips === null) {
               $scope.driverTrips = [];
               CacheSrv.setDriverTrips($scope.driverTrips);
            }
         }
      );
   };

   $scope.selectOfferedTrip = function (index) {
      $state.go('app.viaggio', {
         'travelId': $scope.driverTrips[index].id
      });
   };

   /*
    ***** 2ND TAB *****
    */
   $scope.filter = {
      filterOpen: false,
      toggleFilter: function () {
         this.filterOpen = !this.filterOpen;
         if (this.filterOpen) {
            $ionicScrollDelegate.resize();
         }
      },
      filterBy: function (community) {
         this.selectedCommunity = community;
         // filtering done by watch!
         this.toggleFilter();
      },
      selectedCommunity: null
   };

   $scope.communities = null;
   $scope.myCommunities = null;
   $scope.communityTrips = null;

   $scope.lbl_day = $filter('translate')('lbl_todaytrips');
   var start = new Date();
   var end = new Date();
   $scope.selectDate = Date.now();

   /* Check if the selected date is Today */
   var compareDate = function () {
      if ($scope.selectDate >= start && $scope.selectDate <= end) {
         $scope.lbl_day = $filter('translate')('lbl_todaytrips');
      } else {
         $scope.lbl_day = $filter('date')($scope.selectDate, 'EEE dd/MM/yyyy');
      }
   };

   $scope.allTripsInit = function () {
      Utils.loading();

      var hideMineFromAllCommunities = function () {
         // All communities
         UserSrv.searchCommunities('', '').then(
            function (communities) {
               Utils.loaded();
               for (var i = 0; i < communities.length; i++) {
                  var com = communities[i];
                  angular.forEach($scope.myCommunities, function (mCom) {
                     if (mCom.id === com.id) {
                        communities.splice(i, 1);
                        i--;
                     }
                  });
               }
               $scope.communities = communities;
            },
            function (reason) {
               Utils.loaded();
               Utils.toast(Utils.getErrorMsg(reason));
               $scope.communities = [];
            }
         );
      };

      // My communities
      if (CacheSrv.reloadMyCommunities()) {
         UserSrv.getCommunitiesDetails().then(
            function (myCommunities) {
               Utils.loaded();
               CacheSrv.setReloadMyCommunities(false);
               CacheSrv.setMyCommunities(myCommunities);
               $scope.myCommunities = CacheSrv.getMyCommunities();
               // All communities
               hideMineFromAllCommunities();
            },
            function (reason) {
               Utils.loaded();
               Utils.toast(Utils.getErrorMsg(reason));
               $scope.myCommunities = [];
            }
         );
      } else {
         $scope.myCommunities = CacheSrv.getMyCommunities();
         // All communities
         hideMineFromAllCommunities();
         Utils.loaded();
      }
   };

   $scope.changeDay = function (num) {
      if (Math.abs(num) == 1) {
         var day = 24 * 60 * 60 * 1000;
         $scope.selectDate += num * day;
         compareDate();
         $scope.updateCommunityTrips(!!$scope.filter.selectedCommunity ? $scope.filter.selectedCommunity.id : null);
      }
   };

   $scope.hideYesterday = function () {
      return ($scope.selectDate <= Date.now());
   };

   $scope.updateCommunityTrips = function (cId) {
      UserSrv.getCommunityTravels(cId, $scope.selectDate).then(
         function (todayCommunityTrips) {
            $scope.communityTrips = todayCommunityTrips;
            $scope.communityTrips.forEach(function (trip) {
               trip.bookingCounters = Utils.getBookingCounters(trip);
            });
            setTimeout(function () {
               $ionicScrollDelegate.scrollTop(true);
            }, 200);

            Utils.loaded();
         },
         function (error) {
            Utils.loaded();
            Utils.toast(Utils.getErrorMsg(error));
         }
      );
   };

   $scope.selectTrip = function (index) {
      $state.go('app.viaggio', {
         'travelId': $scope.communityTrips[index].id
      });
   };

   $scope.$watch('filter.selectedCommunity', function (newCom, oldCom) {
      $scope.updateCommunityTrips(!!newCom ? newCom.id : null);
   });

   /*
    * init
    */
   $scope.$on('$ionicView.enter', function () {
      if (!window.ParsePushPlugin) {
         $scope.interval = $interval($rootScope.initCounter, 10000);
      }
      if ($scope.tab === 0) {
         if (CacheSrv.reloadPassengerTrips()) {
            $scope.loadMorePassengerTrips(true);
         }

         if (CacheSrv.reloadDriverTrips()) {
            $scope.loadMoreDriverTrips(true);
         } else if (!!CacheSrv.reloadDriverTrip()) {
            var tripId = CacheSrv.reloadDriverTrip();
            PassengerSrv.getTrip(tripId).then(
               function (updatedTrip) {
                  CacheSrv.setReloadDriverTrip(null);
                  for (var i = 0; i < $scope.driverTrips.length; i++) {
                     if ($scope.driverTrips[i].id === updatedTrip.id) {
                        $scope.driverTrips[i] = updatedTrip;
                        enrichTrip($scope.driverTrips[i]);
                        CacheSrv.setDriverTrips($scope.driverTrips);
                        i = $scope.driverTrips.length;
                     }
                  }
                  Utils.loaded();
               },
               function (error) {
                  CacheSrv.setReloadDriverTrip(null);
                  Utils.loaded();
                  $scope.loadMoreDriverTrips(true);
               }
            );
         }
      } else if ($scope.tab === 1) {
         //if (!$scope.communities || !$scope.myCommunities || !$scope.communityTrips) {
         $scope.allTripsInit();
         //}
      }
   });

   /*
    * exit
    */
   $scope.$on('$ionicView.leave', function () {
      if ($scope.interval) {
         $interval.cancel($scope.interval)
      };
   });
});
