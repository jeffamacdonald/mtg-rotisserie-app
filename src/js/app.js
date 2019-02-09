(function() {
angular.module('rotoDraftApp', [
	'ngRoute',
	'firebase'
])
.config([
	'$routeProvider',
	function($routeProvider) {
		$routeProvider
		.when('/home/', {
			templateUrl: 'views/home.html',
			controller: 'HomeCtrl',
      resolve: {
        'activeDraft': function($firebaseObject,activeDraftService) {
          return activeDraftService.getActiveDraftId().then(function(draftId) {
            return $firebaseObject(firebase.database().ref().child('draftProperties').child(draftId));
          })
        }
      }
		})
		.when('/draft-pool/', {
			templateUrl: 'views/draft.html',
			controller: 'DraftCtrl',
			resolve: {
        'activeDraft': function($firebaseObject,activeDraftService) {
          return activeDraftService.getActiveDraftId().then(function(draftId) {
            return $firebaseObject(firebase.database().ref().child('draftProperties').child(draftId));
          })
        }
			}
		})
    .when('/player-pools/', {
      templateUrl: 'views/pools.html',
      controller: 'PoolsCtrl'
    })
	}
]);
})();