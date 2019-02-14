(function() {

angular
  .module('rotoDraftApp')
  .service('newDraftService', newDraftService);

newDraftService.$inject = ['$firebaseArray','$firebaseObject'];

function newDraftService($firebaseArray,$firebaseObject) {
  const db = firebase.database().ref();
  let draftProperties = $firebaseArray(db.child('draftProperties'));

  this.getAllPlayers = function() {
    return $firebaseArray(db.child('players'));
  };

  this.getAllCubes = function() {
    return $firebaseArray(db.child('cubes'));
  };

  this.startNewDraft = function(cubes,players,rounds) {
    let newDraftId = addNewDraftToDB();
    newDraftId.then(function(draftId) {
      setAllDraftsToInactive(draftId);
      let newDraft = getDraftById(draftId);
      let cube = getCube(cubes);
      let checkedPlayers = getCheckedPlayers(players);
      addRoundsToNewDraft(rounds,newDraft);
      addCubeToNewDraft(cube,newDraft);
      addPlayersToNewDraft(checkedPlayers,newDraft);
    });
  };

  function addNewDraftToDB() {
    let newDraft = {
      activeDraft: true,
      currentRound: 1
    }
    return draftProperties.$add(newDraft).then(function(ref) {
      return ref.key;
    });
  };

  function getDraftById(draftId) {
    return $firebaseObject(db.child('draftProperties').child(draftId));
  };

  function addRoundsToNewDraft(rounds,draft) {
    draft.$loaded(function(draft) {
      draft.totalRounds = rounds;
      draft.$save();
    })
    
  };

  function getActiveDrafts() {
    return $firebaseArray(firebase.database().ref().child('draftProperties').orderByChild('activeDraft').equalTo(true));
  };

  function setAllDraftsToInactive(draftIdToSkip) {
    let activeDrafts = getActiveDrafts();
    activeDrafts.$loaded(function(drafts) {
      angular.forEach(drafts,function(value,key) {
        if(value.$id != draftIdToSkip) {
          let activeDraftValue = $firebaseObject(draftProperties.$ref().child(value.$id).child('activeDraft'));
          activeDraftValue.$value = false;
          activeDraftValue.$save();
        }
      });
    });
  };

  function getCube(cubes) {
    return cubes.filter(function(cube) {
      return cube.isChecked == true;
    });
  };

  function addCubeToNewDraft(cube,draft) {
    draft.$loaded(function(draft) {
      draft.draftPool = cube[0].cards;
      draft.$save();
    });
  };

  function getCheckedPlayers(players) {
    let checkedPlayers = players.filter(function(player) {
      return player.isChecked == true;
    });
    return shuffle(checkedPlayers);
  };

  function addPlayersToNewDraft(players,draft) {
    draft.$loaded(function(draft) {
      draft.playerCount = players.length
      angular.forEach(players, function(value, key) {
        delete value.isChecked;
        value.draftPosition = key+1;
      });
      draft.players = players;
      draft.activePlayer = players[0].draftPosition-1;
      draft.$save();
    });
  };

  function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  };

}
})();