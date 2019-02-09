(function() {

angular
  .module('rotoDraftApp')
  .controller('DraftCtrl', DraftCtrl);

DraftCtrl.$inject = ['$scope','$firebaseArray','$firebaseObject','modalService','activeDraftService','activeDraft'];

function DraftCtrl($scope,$firebaseArray,$firebaseObject,modalService,activeDraftService,activeDraft) {
  let allDrafters = activeDraftService.getAllDrafters(activeDraft);
  let activePlayerId = activeDraftService.getActivePlayerId(activeDraft);

  // Display current player's name
  activePlayerId.$watch(function() {
    angular.forEach(allDrafters,function(value,key) {
      if(value.$id == activePlayerId.$value) {
        $scope.activePlayer = value;
      }
    });
  });

  // Display Cube
  activeDraftService.getActiveCube(activeDraft).then(function(cube) {
    $scope.displayCube = cube;
  });

  $scope.selectCard = function(card) {
    $scope.card = card;
    modalService.displayModal(card);
  };

  $scope.cancelCardSelection = function() {
    modalService.closeModal();
  };

  $scope.pickCard = function(card,activePlayer) {
    activeDraftService.pickCard(card,activeDraft,activePlayer.$id);
    modalService.closeModal();
  };

  $scope.undoLastPick = function(activePlayer) {
    activeDraftService.undoPick(activeDraft,activePlayer.$id);
    document.getElementById('undo-dialog').style.display = 'none';
  };

  $scope.cancelUndo = function() {
    document.getElementById('undo-dialog').style.display = 'none';
  };

  $scope.undoConfirmation = function() {
    document.getElementById('undo-dialog').style.display = 'block';
  };
};
})();