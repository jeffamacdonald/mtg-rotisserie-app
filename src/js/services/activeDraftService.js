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
    setCardsIsDraftedStatus(card, true);
    setNextPlayerActive(false);
  };

  this.undoPick = function() {
    removeCardFromPreviousPlayerPool();
    setNextPlayerActive(true);
  };

  this.getAllPlayers = function() {
    return getActiveDraftId().then(function(draftId) {
      return $firebaseArray(db.child('draftProperties').child(draftId).child('players'));
    });
  };

  this.getDraftArray = function() {
    let draftArr = [];
    let roundArr = [];
    getActiveDraftId().then(function(draftId) {
      let totalRounds = $firebaseObject(db.child('draftProperties').child(draftId).child('totalRounds'));
      totalRounds.$loaded(function(rounds) {
        self.getAllPlayers().then(function(players) {
          for(var i=0;i<rounds.$value;i++) {
            players.forEach(function(player) {
              if(player.cardPool != undefined) {
                let card = player.cardPool[Object.keys(player.cardPool)[i]];
                if(card != undefined) {
                  roundArr.push(card);
                } else {
                  roundArr.push({name:''});
                }
              } else {
                roundArr.push({name:''});
              }
            });
            draftArr.push(roundArr);
            roundArr = [];
          }
        });
      });
    });
    return draftArr;
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

  function removeCardFromPreviousPlayerPool() {
    getActiveDraftId().then(function(draftId) {
      let previousPlayer = $firebaseObject(db.child('draftProperties').child(draftId).child('previousPlayer'));
      previousPlayer.$loaded(function(playerId) {
        let previousPlayerCards = $firebaseArray(db.child('draftProperties').child(draftId).child('players').child(playerId).child('cardPool'));
        var lastPick = previousPlayerCards[previousPlayerCards.length-1];
        setCardsIsDraftedStatus(lastPick, false);
        previousPlayerCards.$remove(lastPick);
      });
    });
  };

  function setCardToIsDrafted(card) {
    getActiveDraftId().then(function(draftId) {
      let activeCube = $firebaseArray(db.child('draftProperties').child(draftId).child('draftPool'));
      activeCube.$loaded(function(pool) {
        angular.forEach(pool, function(value,key) {
          if(value.name == card.name) {
            db.child('draftProperties').child(draftId).child('draftPool').child(value.$id).child('isDrafted').set(bool);
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
        (card.colors != undefined && card.colorIdentity.length == 2 && card.layout == 'transform' && card.colorIdentity[1] == color) || 
        (card.colors != undefined && card.colorIdentity[0] == color && card.colorIdentity.length == 1) || 
        (card.text != undefined && card.text.includes('Devoid') && card.colorIdentity.length == 1 && card.colorIdentity[0] == color)
        ) {
        arr.push(card);
      }
    });
    return sortByCmc(arr);
  };

  function getGoldPoolByColorPair(pool,colorA,colorB) {
    let arr = [];
    pool.forEach(function(card) {
      if(card.colors != undefined && (card.layout == 'normal' || card.layout == 'split') && arrayContains(card.colorIdentity,colorA) && arrayContains(card.colorIdentity,colorB) && card.colorIdentity.length == 2 ||
        (card.text != undefined && card.text.includes('Devoid') && card.manaCost.includes(colorA) && card.manaCost.includes(colorB))) {
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
      if(card.colors == undefined && !arrayContains(card.types,'Land') && !card.text.includes('Devoid')) {
        arr.push(card);
      }
    });
    return sortByCmc(arr);
  };

  function getLandPool(pool) {
    let arr = [];
    pool.forEach(function(card) {
      if(card.colors == undefined && arrayContains(card.types,'Land')) {
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
      return a.multiverseid - b.multiverseid;
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

  function getSnakeDirection(playerPosition, rollbackBool) {
    return getActiveDraftId().then(function(draftId) {
      let activeDraft = $firebaseObject(db.child('draftProperties').child(draftId));
      return activeDraft.$loaded(function(draft) {
        if(draft.currentRound % 2 == 0 && playerPosition > 1 && rollbackBool == false) {
          return 'left';
        } else if (draft.currentRound % 2 == 0 && playerPosition < draft.playerCount-1 && rollbackBool) {
          return 'rollRight';
        } else if (draft.currentRound % 2 == 0 && playerPosition == draft.playerCount-1 && rollbackBool) {
          return 'rollToRightEdge';
        } else if(draft.currentRound % 2 != 0 && playerPosition < draft.playerCount && rollbackBool == false) {
          return 'right';
        } else if (draft.currentRound % 2 != 0 && playerPosition > 2 && rollbackBool) {
          return 'rollLeft';
        } else if (draft.currentRound % 2 != 0 && playerPosition == 2 && rollbackBool) {
          return 'rollToLeftEdge';
        } else if (playerPosition == 1 && rollbackBool) {
          setPreviousRound(draft);
          return 'rollToPreviousRoundLeft';
        } else if(playerPosition == draft.playerCount && rollbackBool) {
          setPreviousRound(draft);
          return 'rollToPreviousRoundRight';
        } else {
          setNextRound(draft);
        }
      });
    });
  };

  function setNextRound(draft) {
    db.child('draftProperties').child(draft.$id).child('currentRound').set(draft.currentRound+1);
  };

  function setPreviousRound(draft) {
    db.child('draftProperties').child(draft.$id).child('currentRound').set(draft.currentRound-1);
  };

  function setNextPlayerActive(rollbackBool) {
    getActiveDraftId().then(function(draftId) {
      getActivePlayerPosition().then(function(position) {
        let players = $firebaseArray(db.child('draftProperties').child(draftId).child('players'));
        players.$loaded(function(activePlayers) {
          getSnakeDirection(position, rollbackBool).then(function(direction) {
            var newPosition = position;
            switch(direction) {
              case 'right':
                newPosition++;
                break;
              case 'rollRight':
                newPosition++;
                position = position + 2;
                break;
              case 'rollToRightEdge':
                newPosition++;
                position++;
                break;
              case 'rollToPreviousRoundRight':
                position--;
                break;
              case 'left':
                newPosition--;
                break;
              case 'rollLeft':
                newPosition--;
                position = position - 2;
                break;
              case 'rollToLeftEdge':
                newPosition--;
                position--;
              case 'rollToPreviousRoundLeft':
                position++;
                break;
              default:
                break;
            }
            angular.forEach(activePlayers, function(value,key) {
              if(value.draftPosition == newPosition) {
                db.child('draftProperties').child(draftId).child('activePlayer').set(value.$id);
              } else if(value.draftPosition == position) {
                db.child('draftProperties').child(draftId).child('previousPlayer').set(value.$id);
              } 
            });
          });
        });
      });
    });
  };

};
})();