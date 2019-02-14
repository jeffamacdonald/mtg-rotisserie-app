(function() {

angular
	.module('rotoDraftApp')
	.service('modalService', modalService);

function modalService() {

  this.displayModal = function(cardObj,draft) {
    if(!(cardObj.isDrafted || Number(draft.currentRound) > Number(draft.totalRounds))) {
      document.getElementById('card-dialog').style.display = 'block';
    }
  };

  this.closeModal = function() {
    document.getElementById('card-dialog').style.display = 'none';
  };
};
})();