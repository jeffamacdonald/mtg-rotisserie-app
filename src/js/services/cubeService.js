(function() {

angular
	.module('rotoDraftApp')
	.service('cubeService', cubeService);

cubeService.$inject = ['$firebaseArray','$firebaseObject'];

function cubeService($firebaseArray,$firebaseObject) {
  var self = this;
  const db = firebase.database().ref();

  //Upload Cube Functions TODO: allow cube uploads
  function getCardFromApi(cardName) {
    if(cardName.includes('//')) {
      var searchName = cardName.split('//')[0].trim();
      return axios.get("https://api.magicthegathering.io/v1/cards?name="+searchName).then(function(data) {
        let cardData = data.data.cards;
        for(var i=0;i<cardData.length;i++) {
          if(cardData[i].name === searchName) {
            cardData[i].name = cardName;
            return formatCardObject(cardData[i]);
          }
        }
      });
    } else {
      return axios.get("https://api.magicthegathering.io/v1/cards?name="+cardName).then(function(data) {
        let cardData = data.data.cards;
        for(var i=0;i<cardData.length;i++) {
          if(cardData[i].name === cardName) {
            return formatCardObject(cardData[i]);
          }
        }
      });
    }
  }

  this.getCard = function(cardName) {
    getCardFromApi(cardName).then(function(card) {
      console.log(card)
    })
  }

  this.createNewCube = function(cubeArray,name) {
    let cube = {
      name: name,
      cards: {}
    }
    $firebaseArray(db.child('cubes')).$add(cube).then(function(newCube) {
      addCardsToCube(cubeArray,newCube.key);
    });
  }

  function addCardsToCube(cubeArray,cubeId) {
    cubeArray.forEach(function(card) {
      getCardFromApi(card).then(function(cardObj) {
        $firebaseArray(db.child('cubes').child(cubeId).child('cards')).$add(cardObj);
      });
    });
  }

  function formatCardObject(cardObj) {
    delete cardObj.artist;
    delete cardObj.flavor;
    delete cardObj.foreignNames;
    delete cardObj.legalities;
    delete cardObj.number;
    delete cardObj.printings;
    delete cardObj.rarity;
    delete cardObj.releaseDate;
    delete cardObj.set;
    delete cardObj.setName;
    delete cardObj.source;
    delete cardObj.originalText;
    delete cardObj.originalType;
    delete cardObj.language;
    delete cardObj.source;
    delete cardObj.rulings;
    delete cardObj.starter;
    delete cardObj.reserved;
    delete cardObj.timeshifted;
    delete cardObj.border;
    delete cardObj.watermark;
    delete cardObj.id;
    delete cardObj.legality;
    delete cardObj.gameFormat;
    delete cardObj.imageUrl;
    delete cardObj.type;
    cardObj.isDrafted = false;
    return cardObj;
  }
};
})();