(function() {

angular
  .module('rotoDraftApp')
  .service('activeDraftService', activeDraftService);

activeDraftService.$inject = ['$firebaseArray','$firebaseObject','$http'];

function activeDraftService($firebaseArray,$firebaseObject,$http) {
  var self = this;

  // cube section vars
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

  // public draft functions
  this.pickCard = function(card,draft,playerId) {
    addCardToActivePlayerPool(card,draft,playerId);
    setCardsIsDraftedStatus(card,draft,true);
    setNextPlayerActive(draft,playerId,false);
    postPickToSlack(draft,card,playerId);
  };

  this.undoPick = function(draft,playerId) {
    removeCardFromPreviousPlayerPool(draft);
    setNextPlayerActive(draft,playerId,true);
  };

  // public get functions
  this.getActivePlayerId = function(draft) {
    return $firebaseObject(draft.$ref().child('activePlayer'));
  };

  this.getActiveDraftId = function() {
    return $firebaseArray(firebase.database().ref().child('draftProperties').orderByChild('activeDraft').equalTo(true)).$loaded(function(draft) {
      return draft[0].$id;
    });
  };

  this.getAllDrafters = function(draft) {
    return $firebaseArray(draft.$ref().child('players'));
  };

  this.getActiveCube = function(draft) {
    return $firebaseArray(draft.$ref().child('draftPool')).$loaded(function(pool) {
      cubeArr = [];
      colorSections.forEach(function(color) {
        cubeArr.push(getPoolByColor(pool,color));
      });
      goldSections.forEach(function(colorPair) {
        cubeArr.push(getGoldPoolByColorPair(pool,colorPair[0],colorPair[1]));
      });
      cubeArr.push(getRemainingGoldPool(pool));
      cubeArr.push(getColorlessPool(pool));
      cubeArr.push(getLandPool(pool));
      return cubeArr;
    });
  };

  this.searchActiveCube = function(draft,term) {
    activeCube = self.getActiveCube(draft);
    let cubeArr = [];
    activeCube.then(function(cube) {
      cube.forEach(function(section) {
        let sectionArr = [];
        section.forEach(function(card) {
          let searchTerm = term.toLowerCase();
          let text = "";
          if(card.text != undefined) {
            text = card.text.toLowerCase();
          }
          let name = card.name.toLowerCase();
          if(text.includes(searchTerm)) {
            sectionArr.push(card);
          } else if(name.includes(searchTerm)) {
            sectionArr.push(card);
          }
        });
        if(sectionArr != []) {
          cubeArr.push(sectionArr);
        }
      });
    });
    return cubeArr;
  };

  this.getDraftArray = function(draft,allDrafters) {
    let draftArr = [];
    let roundArr = [];
    let totalRounds = $firebaseObject(draft.$ref().child('totalRounds'));
    totalRounds.$loaded(function(rounds) {
      for(var i=0;i<rounds.$value;i++) {
        allDrafters.forEach(function(player) {
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
    return draftArr;
  };

  this.copyPlayersCards = function(player) {
    let cards = getPlayersCardNamesAsString(player);
    copyToClipboard(cards);
  };

  this.getTextStyle = function(card) {
    if(card.colors == undefined && card.types == undefined) {
      return;
    } else if((card.colors != undefined && card.colorIdentity.length == 2 && card.layout == 'transform' && card.colorIdentity[1] == 'W') || 
      (card.colors != undefined && card.colorIdentity[0] == 'W' && card.colorIdentity.length == 1)) {
      return {'background':'#fafad2','color':'black','text-shadow':'none'};
    } else if((card.colors != undefined && card.colorIdentity.length == 2 && card.layout == 'transform' && card.colorIdentity[1] == 'U') || 
      (card.colors != undefined && card.colorIdentity[0] == 'U' && card.colorIdentity.length == 1)) {
      return {'background':'blue'};
    } else if((card.colors != undefined && card.colorIdentity.length == 2 && card.layout == 'transform' && card.colorIdentity[1] == 'B') || 
      (card.colors != undefined && card.colorIdentity[0] == 'B' && card.colorIdentity.length == 1)) {
      return {'background':'black','text-shadow':'none'};
    } else if((card.colors != undefined && card.colorIdentity.length == 2 && card.layout == 'transform' && card.colorIdentity[1] == 'R') || 
      (card.colors != undefined && card.colorIdentity[0] == 'R' && card.colorIdentity.length == 1)) {
      return {'background':'#ff0000'};
    } else if((card.colors != undefined && card.colorIdentity.length == 2 && card.layout == 'transform' && card.colorIdentity[1] == 'G') || 
      (card.colors != undefined && card.colorIdentity[0] == 'G' && card.colorIdentity.length == 1)) {
      return {'background':'green'};
    } else if(card.colors != undefined && (card.layout != 'transform' || card.name == "Nicol Bolas, the Ravager") && card.colorIdentity.length > 2) {
      return {'background':'#e6c300','color':'black','text-shadow':'none'};
    } else if(card.colors != undefined && card.layout != 'transform' && card.colorIdentity.length == 2) {
      let colorArray = getCardColorPair(card);
      return {'background-image': 'linear-gradient(to right, '+colorArray[2]+', '+colorArray[3]+')'};
    } else if(arrayContains(card.types,'Land')) {
      return {'background':'#ffa64d','color':'black','text-shadow':'none'};
    } else {
      return {'background':'grey'};
    }
  };

  goldSections = [
    ['W','U','#fafad2','blue'],
    ['W','B','#fafad2','black'],
    ['W','R','#fafad2','#ff0000'],
    ['W','G','#fafad2','green'],
    ['U','B','blue','black'],
    ['U','R','blue','#ff0000'],
    ['U','G','blue','green'],
    ['B','R','black','#ff0000'],
    ['B','G','black','green'],
    ['R','G','#ff0000','green']
  ]

  function getCardColorPair(card) {
    let colorPairArray = goldSections.filter(function(section) {
      return (arrayContains(card.colorIdentity,section[0]) && arrayContains(card.colorIdentity,section[1])) || (card.text != undefined && card.text.includes('Devoid') && card.manaCost.includes(section[0]) && card.manaCost.includes(section[1]));
    });
    return colorPairArray[0];
  };

  function arrayContains(arr,str) {
    return (arr.indexOf(str) > -1);
  };

  // Pick card functions
  function addCardToActivePlayerPool(card,draft,playerId) {
    let activePlayerCards = $firebaseArray(draft.$ref().child('players').child(playerId).child('cardPool'));
    activePlayerCards.$add(card);
  };

  function removeCardFromPreviousPlayerPool(draft) {
    let previousPlayer = $firebaseObject(draft.$ref().child('previousPlayer'));
    previousPlayer.$loaded(function(playerId) {
      let previousPlayerCards = $firebaseArray(draft.$ref().child('players').child(playerId.$value).child('cardPool'));
      previousPlayerCards.$loaded(function(cards) {
        var lastPick = cards[cards.length-1];
        setCardsIsDraftedStatus(lastPick, draft, false);
        previousPlayerCards.$remove(lastPick);
      });
    });
  };

  function setCardsIsDraftedStatus(card, draft, bool) {
    let activeCube = $firebaseArray(draft.$ref().child('draftPool'));
    activeCube.$loaded(function(pool) {
      angular.forEach(pool, function(value,key) {
        if(value.name == card.name) {
          draft.$ref().child('draftPool').child(value.$id).child('isDrafted').set(bool);
        }
      });
    });
  };

  function getActivePlayerPosition(draft,playerId) {
    let activePlayerPosition = $firebaseObject(draft.$ref().child('players').child(playerId).child('draftPosition'));
    return activePlayerPosition.$loaded(function(playerPosition) {
      return playerPosition.$value;
    });
  };

    function setNextPlayerActive(draft,playerId,rollbackBool) {
    getActivePlayerPosition(draft,playerId).then(function(position) {
      let players = $firebaseArray(draft.$ref().child('players'));
      players.$loaded(function(activePlayers) {
        getSnakeDirection(draft, position, rollbackBool).then(function(direction) {
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
              break;
            case 'rollToPreviousRoundLeft':
              position++;
              break;
            default:
              break;
          }
          angular.forEach(activePlayers, function(value,key) {
            if(value.draftPosition == newPosition) {
              draft.$ref().child('activePlayer').set(value.$id);
            } 
            if(value.draftPosition == position) {
              draft.$ref().child('previousPlayer').set(value.$id);
            } 
          });
        });
      });
    });
  };

  function getSnakeDirection(draft, playerPosition, rollbackBool) {
    return draft.$loaded(function(draft) {
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
  };

  function setNextRound(draft) {
    draft.$ref().child('currentRound').set(draft.currentRound+1);
  };

  function setPreviousRound(draft) {
    draft.$ref().child('currentRound').set(draft.currentRound-1);
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
    return sortCardSection(arr);
  };

  function getGoldPoolByColorPair(pool,colorA,colorB) {
    let arr = [];
    pool.forEach(function(card) {
      if(card.colors != undefined && (card.layout == 'normal' || card.layout == 'split') && arrayContains(card.colorIdentity,colorA) && arrayContains(card.colorIdentity,colorB) && card.colorIdentity.length == 2 ||
        (card.text != undefined && card.text.includes('Devoid') && card.manaCost.includes(colorA) && card.manaCost.includes(colorB))) {
        arr.push(card);
      }
    });
    return sortCardSection(arr);
  };

  function getRemainingGoldPool(pool) {
    let arr = [];
    pool.forEach(function(card) {
      if(card.colors != undefined && card.colorIdentity.length > 2) {
        arr.push(card);
      }
    });
    return sortCardSection(arr);
  };

  function getColorlessPool(pool) {
    let arr = [];
    pool.forEach(function(card) {
      if(card.colors == undefined && !arrayContains(card.types,'Land') && !card.text.includes('Devoid')) {
        arr.push(card);
      }
    });
    return sortCardSection(arr);
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
  function sortCardSection(arr) {
    return arr.sort(function(a,b) {
      a.typeSort = isCardCreature(a);
      b.typeSort = isCardCreature(b);
      let alphaSort = a.name > b.name ? 1 : -1;
      return (a.cmc - b.cmc) || (a.typeSort - b.typeSort) || alphaSort;
    });
  };

  function isCardCreature(card) {
    if(card.types.includes('Creature')) {
      return 1;
    } else {
      return 0;
    }
  };

  function sortByColors(arr) {
    return arr.sort(function(a,b) {
      return JSON.stringify(a.colors) - JSON.stringify(b.colors);
    });
  };

  function sortLand(arr) {
    return arr.sort(function(a,b) {
      a.typeSort = whichLand(a);
      b.typeSort = whichLand(b);
      let alphaSort = a.name > b.name ? 1 : -1;
      return (a.typeSort - b.typeSort) || alphaSort;
    });
  };

  function whichLand(card) {
    const landText = ['enters the battlefield, you may pay 2 life','{T}, Pay 1 life, Sacrifice','enters the battlefield tapped.\n{T}: Add {','enters the battlefield tapped unless you control two or fewer','enters the battlefield, scry 1','enters the battlefield tapped\nCycling','({T}: Add {']
    for(var i=0;i<landText.length;i++) {
      if(card.text.includes(landText[i])) {
        return i;
      } else if(i == landText.length-1) {
        return i+1;
      }
    }
  };

  function arrayContains(arr,str) {
    return (arr.indexOf(str) > -1);
  };

  // Slack Integration
  function postPickToSlack(draft,card,playerId) {
    const slackWebHookUrl = 'https://hooks.slack.com/services/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';
    let playerName = $firebaseObject(draft.$ref().child('players').child(playerId).child('name'));
    playerName.$loaded(function(name) {
      var message = name.$value + " has picked " + card.name;
      $http({
        url: slackWebHookUrl,
        method: "POST",
        data: 'payload=' + JSON.stringify({"text": message}),
        headers: {"Content-type": "application/x-www-form-urlencoded; charset=UTF-8"}
      });
    });
  };

  // Copy text
  function copyToClipboard(str) {
    const el = document.createElement('textarea');  // Create a <textarea> element
    el.value = str;                                 // Set its value to the string that you want copied
    el.setAttribute('readonly', '');                // Make it readonly to be tamper-proof
    el.style.position = 'absolute';                 
    el.style.left = '-9999px';                      // Move outside the screen to make it invisible
    document.body.appendChild(el);                  // Append the <textarea> element to the HTML document
    const selected =            
      document.getSelection().rangeCount > 0        // Check if there is any content selected previously
        ? document.getSelection().getRangeAt(0)     // Store selection if found
        : false;                                    // Mark as false to know no selection existed before
    el.select();                                    // Select the <textarea> content
    document.execCommand('copy');                   // Copy - only works as a result of a user action (e.g. click events)
    document.body.removeChild(el);                  // Remove the <textarea> element
    if (selected) {                                 // If a selection existed before copying
      document.getSelection().removeAllRanges();    // Unselect everything on the HTML document
      document.getSelection().addRange(selected);   // Restore the original selection
    }
  };

  function getPlayersCardNamesAsString(player) {
    let cards = '';
    angular.forEach(player.cardPool,function(value,key) {
      cards = cards + value.name + '\n';
    });
    return cards;
  };
};
})();
