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
			controller: 'HomeCtrl'
		})
		.when('/draft-pool/', {
			templateUrl: 'views/draft.html',
			controller: 'DraftCtrl',
			resolve: {
				'activeDraft': function($firebaseArray) {
					return $firebaseArray(firebase.database().ref().child('draftProperties').orderByChild('activeDraft').equalTo(true)).$loaded();
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