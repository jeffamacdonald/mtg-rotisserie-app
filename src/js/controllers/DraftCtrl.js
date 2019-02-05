(function() {

angular
  .module('rotoDraftApp')
  .controller('DraftCtrl', DraftCtrl);

DraftCtrl.$inject = ['$scope','$firebaseArray','$firebaseObject','modalService','activeDraftService'];

function DraftCtrl($scope,$firebaseArray,$firebaseObject,modalService,activeDraftService) {
	const db = firebase.database().ref();
  
  activeDraftService.getActiveCube().then(function(cubeSections) {
    $scope.displayCube = cubeSections;
  });
  activeDraftService.getActivePlayerName().then(function(player) {
    $scope.activePlayer = player;
  });
  activeDraftService.getActivePlayerId().then(function(playerId) {
    playerId.$watch(function() {
      activeDraftService.getActivePlayerName().then(function(player) {
        $scope.activePlayer = player;
      });
    });
  });

  $scope.selectCard = function(card) {
    $scope.card = card;
    modalService.displayModal(card);
  };

  $scope.cancelCardSelection = function() {
    modalService.closeModal();
  };
    
  $scope.pickCard = function(card) {
    activeDraftService.pickCard(card);
    modalService.closeModal();
  };

  $scope.undoLastPick = function() {
    activeDraftService.undoPick();
  };
};
})();