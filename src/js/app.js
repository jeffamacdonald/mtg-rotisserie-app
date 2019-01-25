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
			controller: 'DraftCtrl'
		})
	}
]);
})();