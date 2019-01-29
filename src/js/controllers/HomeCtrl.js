(function() {

angular
  .module('rotoDraftApp')
  .controller('HomeCtrl', HomeCtrl);

HomeCtrl.$inject = ['$scope','$firebaseArray','$firebaseObject','activeDraftService'];

function HomeCtrl($scope,$firebaseArray,$firebaseObject,activeDraftService) {
  const db = firebase.database().ref();
  let settingsModal = document.getElementById('draft-settings-dialog');

  let draftProperties = $firebaseArray(db.child('draftProperties'));

  let allPlayers = $firebaseArray(db.child('players'));
  allPlayers.$loaded(function(players) {
    players.forEach(function(player) {
      player.isChecked = true;
    })
    $scope.players = players;
  });

  $scope.numberOfRounds = 45;

  $scope.draftSettingsModal = function() {
    settingsModal.style.display = 'block';
  }
  $scope.cancelModal = function() {
    settingsModal.style.display = 'none';
  }

  $scope.startNewDraft = function() {
    settingsModal.style.display = 'none';
    let newDraft = {
      activeDraft: true,
      totalRounds: $scope.numberOfRounds,
      currentRound: 1
    }
    draftProperties.$add(newDraft).then(function(ref) {
      draftProperties.$loaded(function(properties) {
        let id = ref.key;
        let newDraftRef = db.child('draftProperties').child(id);
        angular.forEach(properties, function(value, key) {
          if(value.$id != id) {
            db.child('draftProperties').child(value.$id).child('activeDraft').set(false);
          }
        });
        let cube = $firebaseArray(db.child('cubes').child('alexCube'));
        cube.$loaded(function(draftPool) {
          angular.forEach(draftPool, function(value, key) {
            $firebaseArray(newDraftRef.child('draftPool')).$add(value);
          });
        });

        let draftPlayers = $scope.players.filter(function(player) {
          return player.isChecked == true;
        });
        newDraftRef.child('playerCount').set(draftPlayers.length);
        draftPlayers = shuffle(draftPlayers);
        $scope.pickArray = initializePickArray(draftPlayers.length,$scope.numberOfRounds);
        angular.forEach(draftPlayers, function(value, key) {
          delete value.isChecked;
          value.draftPosition = key+1;
          $firebaseArray(newDraftRef.child('players')).$add(value).then(function(playerRef) {
            if(key == 0) {
              newDraftRef.child('activePlayer').set(playerRef.key);
            }
          });
        });
      });
    });
  };

  $scope.textColor = function(card) {
    if(card.colors == undefined && card.type == undefined) {
      return;
    } else if((card.colors != undefined && card.colorIdentity.length == 2 && card.names != undefined && card.colorIdentity[1] == 'W') || 
      (card.colors != undefined && card.colorIdentity[0] == 'W' && card.colorIdentity.length == 1)) {
      return {background:'white',color:'black'};
    } else if((card.colors != undefined && card.colorIdentity.length == 2 && card.names != undefined && card.colorIdentity[1] == 'U') || 
      (card.colors != undefined && card.colorIdentity[0] == 'U' && card.colorIdentity.length == 1)) {
      return {background:'blue'};
    } else if((card.colors != undefined && card.colorIdentity.length == 2 && card.names != undefined && card.colorIdentity[1] == 'B') || 
      (card.colors != undefined && card.colorIdentity[0] == 'B' && card.colorIdentity.length == 1)) {
      return {background:'black'};
    } else if((card.colors != undefined && card.colorIdentity.length == 2 && card.names != undefined && card.colorIdentity[1] == 'R') || 
      (card.colors != undefined && card.colorIdentity[0] == 'R' && card.colorIdentity.length == 1)) {
      return {background:'#cc0000'};
    } else if((card.colors != undefined && card.colorIdentity.length == 2 && card.names != undefined && card.colorIdentity[1] == 'G') || 
      (card.colors != undefined && card.colorIdentity[0] == 'G' && card.colorIdentity.length == 1)) {
      return {background:'green'};
    } else if(card.colors != undefined && card.names == undefined && card.colorIdentity.length == 2) {
      return {background:'#f9d006',color:'black'};
    } else if(card.colors == undefined && (card.type == 'Land' || card.type == 'Land — Urza’s')) {
      return {background:'#ac7339'};
    } else {
      return {background:'grey'};
    }
  }

  $scope.draftPicks = activeDraftService.getDraftArray();

  activeDraftService.getAllPlayers().then(function(players) {
    $scope.playerArray = players;
  });

  function initializePickArray(playerCount, totalRounds) {
    var arr = []
    for(var i=0;i<playerCount;i++) {
      arr.push(['']);
    }
    return arr;
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
  }
}
})();