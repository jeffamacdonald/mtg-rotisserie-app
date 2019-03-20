(function() {

angular
  .module('rotoDraftApp')
  .controller('DraftCtrl', DraftCtrl);

DraftCtrl.$inject = ['$scope','modalService','activeDraftService','activeDraft'];

function DraftCtrl($scope,modalService,activeDraftService,activeDraft) {
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

  $scope.searchCube = function(searchTerm) {
    $scope.displayCube = activeDraftService.searchActiveCube(activeDraft,searchTerm);
  };

  $scope.selectCard = function(card) {
    $scope.card = card;
    modalService.displayModal(card,activeDraft);
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

  $scope.colorSectionArray = function(index) {
    let colorArray = ["white","blue","black","red","green","uw","wb","wr","wg","ub","ur","ug","br","bg","rg","gold","colorless","land"];
    return colorArray[index];
  };

  $scope.textColor = function(card) {
    return activeDraftService.getTextStyle(card);
  };
};
})();