(function() {

angular
  .module('rotoDraftApp')
  .controller('PoolsCtrl', PoolsCtrl);

PoolsCtrl.$inject = ['$scope','$firebaseArray','$firebaseObject'];

function PoolsCtrl($scope,$firebaseArray,$firebaseObject) {
  const db = firebase.database().ref();

  function getAllPlayers() {
    return getActiveDraftId().then(function(draftId) {
      return $firebaseArray(db.child('draftProperties').child(draftId).child('players'));
    });
  };

  function getActiveDraftId() {
    let activeDraft = $firebaseArray(firebase.database().ref().child('draftProperties').orderByChild('activeDraft').equalTo(true));
    return activeDraft.$loaded(function(draft) {
      return draft[0].$id;
    });
  };

  getAllPlayers().then(function(drafters) {
    $scope.drafters = drafters;
  });
};
})();