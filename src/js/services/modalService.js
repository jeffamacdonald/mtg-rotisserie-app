(function() {

angular
	.module('rotoDraftApp')
	.service('modalService', modalService);

function modalService() {
  let cardDialog = document.getElementById('card-dialog');

  this.displayModal = function(cardObj) {
    if(!cardObj.isDrafted) {
      cardDialog.style.display = 'block';
    }
  };

  this.closeModal = function() {
    cardDialog.style.display = 'none';
  };
};
})();