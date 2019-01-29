(function() {

angular
	.module('rotoDraftApp')
	.service('modalService', modalService);

function modalService() {

  this.displayModal = function(cardObj) {
    if(!cardObj.isDrafted) {
      document.getElementById('card-dialog').style.display = 'block';
    }
  };

  this.closeModal = function() {
    document.getElementById('card-dialog').style.display = 'none';
  };
};
})();