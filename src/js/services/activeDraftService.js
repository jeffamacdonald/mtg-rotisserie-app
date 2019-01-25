(function() {

angular
	.module('rotoDraftApp')
	.service('activeDraftService', activeDraftService);

activeDraftService.$inject = ['$firebaseArray','$firebaseObject'];

function activeDraftService($firebaseArray,$firebaseObject) {
  var self = this;
  const db = firebase.database().ref();

  this.getActiveCube = function() {
    return getActiveDraftId().then(function(draftId) {
      let draftPool = $firebaseArray(db.child('draftProperties').child(draftId).child('draftPool'));
      return draftPool.$loaded(function(pool) {
        cubeArr = []
        colorSections = ['W','U','B','R','G'];
        goldSections = [
          ['W','U'],
          ['W','B'],
          ['W','R'],
          ['W','G'],
          ['U','B'],
          ['U','R'],
          ['U','G'],
          ['B','R'],
          ['B','G'],
          ['R','G']
        ]
        colorSections.forEach(function(color) {
          cubeArr.push(getPoolByColor(pool,color));
        });
        goldSections.forEach(function(colorPair) {
          cubeArr.push(getGoldPoolByColorPair(pool,colorPair[0],colorPair[1]));
        });
        cubeArr.push(getRemainingGoldPool(pool));
        cubeArr.push(getColorlessPool(pool));
        cubeArr.push(getLandPool(pool));
        return cubeArr
      });
    });
  };

  this.getActivePlayerName = function() {
    return getActiveDraftId().then(function(draftId) {
      return self.getActivePlayerId(draftId).then(function(playerId) {
        let activePlayerName = $firebaseObject(db.child('draftProperties').child(draftId).child('players').child(playerId.$value).child('name'));
        return activePlayerName.$loaded(function(name) {
          return name.$value;
        });
      });
    });
  };

  this.pickCard = function(card) {
    addCardToActivePlayerPool(card);
    setCardToIsDrafted(card);
    setNextPlayerActive();
  };

  // get active ids
  this.getActivePlayerId = function() {
    return getActiveDraftId().then(function(draftId) {
      let activePlayer = $firebaseObject(db.child('draftProperties').child(draftId).child('activePlayer'));
      return activePlayer.$loaded(function(playerId) {
        return playerId;
      });
    });
  };

  function getActiveDraftId() {
    let activeDraft = $firebaseArray(firebase.database().ref().child('draftProperties').orderByChild('activeDraft').equalTo(true));
    return activeDraft.$loaded(function(draft) {
      return draft[0].$id;
    });
  };

  // Pick card functions
  function addCardToActivePlayerPool(card) {
    getActiveDraftId().then(function(draftId) {
      self.getActivePlayerId(draftId).then(function(playerId) {
        let activePlayerCards = $firebaseArray(db.child('draftProperties').child(draftId).child('players').child(playerId.$value).child('cardPool'));
        activePlayerCards.$add(card);
      });
    });
  };

  function setCardToIsDrafted(card) {
    getActiveDraftId().then(function(draftId) {
      let activeCube = $firebaseArray(db.child('draftProperties').child(draftId).child('draftPool'));
      activeCube.$loaded(function(pool) {
        angular.forEach(pool, function(value,key) {
          if(value.name == card.name) {
            db.child('draftProperties').child(draftId).child('draftPool').child(value.$id).child('isDrafted').set(true);
          }
        });
      });
    });
  };

  // Get individual draft pool sections
  function getPoolByColor(pool,color) {
    let arr = [];
    pool.forEach(function(card) {
      if(
        (card.colors != undefined && card.colorIdentity.length == 2 && card.names != undefined && card.colorIdentity[1] == color) || 
        (card.colors != undefined && card.colorIdentity[0] == color && card.colorIdentity.length == 1)
        ) {
        arr.push(card);
      }
    });
    return sortByCmc(arr);
  };

  function getGoldPoolByColorPair(pool,colorA,colorB) {
    let arr = [];
    pool.forEach(function(card) {
      if(card.colors != undefined && card.names == undefined && arrayContains(card.colorIdentity,colorA) && arrayContains(card.colorIdentity,colorB) && card.colorIdentity.length == 2) {
        arr.push(card);
      }
    });
    return sortByCmc(arr);
  };

  function getRemainingGoldPool(pool) {
    let arr = [];
    pool.forEach(function(card) {
      if(card.colors != undefined && card.colorIdentity.length > 2) {
        arr.push(card);
      }
    });
    return sortByCmc(arr);
  };

  function getColorlessPool(pool) {
    let arr = [];
    pool.forEach(function(card) {
      if(card.colors == undefined && (card.type != 'Land' && card.type != 'Land — Urza’s')) {
        arr.push(card);
      }
    });
    return sortByCmc(arr);
  };

  function getLandPool(pool) {
    let arr = [];
    pool.forEach(function(card) {
      if(card.colors == undefined && (card.type == 'Land' || card.type == 'Land — Urza’s')) {
        arr.push(card);
      }
    });
    return sortLand(arr);
  };

  // sort functions
  function sortByCmc(arr) {
    return arr.sort(function(a,b) {
      return a.cmc - b.cmc;
    });
  };

  function sortByColors(arr) {
    return arr.sort(function(a,b) {
      return JSON.stringify(a.colors) - JSON.stringify(b.colors);
    });
  };

  function sortLand(arr) {
    return arr.sort(function(a,b) {
      a.colorIdentity = a.colorIdentity == undefined ? [] : a.colorIdentity;
      b.colorIdentity = b.colorIdentity == undefined ? [] : b.colorIdentity;
      return a.colorIdentity.length - b.colorIdentity.length;
    });
  };

  function arrayContains(arr,str) {
    return (arr.indexOf(str) > -1);
  };

  function getActivePlayerPosition() {
    return getActiveDraftId().then(function(draftId) {
      return self.getActivePlayerId().then(function(playerId) {
        let activePlayerPosition = $firebaseObject(db.child('draftProperties').child(draftId).child('players').child(playerId.$value).child('draftPosition'));
        return activePlayerPosition.$loaded(function(playerPosition) {
          return playerPosition.$value;
        });
      });
    });
  };

  function getSnakeDirection(playerPosition) {
    return getActiveDraftId().then(function(draftId) {
      let activeDraft = $firebaseObject(db.child('draftProperties').child(draftId));
      return activeDraft.$loaded(function(draft) {
        if(draft.currentRound % 2 == 0 && playerPosition != 1) {
          return 'left';
        } else if(draft.currentRound % 2 != 0 && playerPosition != draft.playerCount) {
          return 'right';
        } else {
          setNextRound(draft);
        }
      });
    });
  };

  function setNextRound(draft) {
    db.child('draftProperties').child(draft.$id).child('currentRound').set(draft.currentRound+1);
  };

  function setNextPlayerActive() {
    getActiveDraftId().then(function(draftId) {
      getActivePlayerPosition().then(function(position) {
        let players = $firebaseArray(db.child('draftProperties').child(draftId).child('players'));
        players.$loaded(function(activePlayers) {
          getSnakeDirection(position).then(function(direction) {
            switch(direction) {
              case 'right':
                position++;
                break;
              case 'left':
                position--;
                break;
              default:
                break;
            }
            angular.forEach(activePlayers, function(value,key) {
              if(value.draftPosition == position) {
                db.child('draftProperties').child(draftId).child('activePlayer').set(value.$id);
              }
            });
          });
        });
      });
    });
  };

};
})();