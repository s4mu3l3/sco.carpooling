angular.module('carpooling.controllers.communityinfo', [])

.controller('CommunityInfoCtrl', function ($scope, $rootScope, $state, $stateParams, UserSrv, Utils) {
    $scope.community = $stateParams['community'];
    console.log($scope.community);
    UserSrv.getCommunityTravels($scope.community.id, Date.now()).then(
        function (todayCommunities) {
            console.log(todayCommunities);
            $scope.communityList = todayCommunities;
        });
})

.controller('CommComponentsCtrl', function ($scope, $rootScope, $state, $stateParams, StorageSrv) {
    $scope.showUser = function (index) {
        var user = $scope.community.userObjs[index];
        if (user.userId == StorageSrv.getUser().userId) {
            $state.go('app.profilo.userinfo');
        } else {
            $state.go('app.profilo.userinfo', {
                'user': user
            });
        }
    };
})

.controller('CommTripCtrl', function ($scope, $rootScope, $state, $stateParams, Utils, UserSrv) {
    $scope.communityList.forEach(function (travel) {
        travel.bookingCounters = Utils.getBookingCounters(travel);
    });
    $scope.selectTrip = function (index) {
        $state.go('app.viaggio', {
            'travelId': $scope.communityList[index].id
        });
    };
    $scope.addTrip = function () {
        $state.go('app.offri');
    }
})

.controller('CommInfoCtrl', function ($scope, $rootScope, $state, $stateParams, StorageSrv) {
    var haveAuto = !!StorageSrv.getUser().auto;
    if (!!haveAuto) {
        $scope.btnAutoText = 'lbl_editauto';
    } else {
        $scope.btnAutoText = 'lbl_addauto';
    }
    $scope.changeAutoState = function () {
        $state.go('app.profilo.userinfo', {
            'communityFrom': $scope.community,
            'editMode': true
        });
    };
});
