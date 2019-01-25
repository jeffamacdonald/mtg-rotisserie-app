(function() {

angular
  .module('rotoDraftApp')
  .controller('HomeCtrl', HomeCtrl);

HomeCtrl.$inject = ['$scope','$firebaseArray','$firebaseObject'];

function HomeCtrl($scope,$firebaseArray,$firebaseObject) {
  const db = firebase.database().ref();
  let settingsModal = document.getElementById('draft-settings-dialog');

  // $scope.tableHeader = [];

  let draftProperties = $firebaseArray(db.child('draftProperties'));
  // draftProperties.$loaded(function(properties) {
  //   angular.forEach(properties, function(value,key){
  //     if(value.activeDraft == true) {
  //       angular.forEach(value.players, function(val,k) {
  //         let player = $firebaseObject(db.child('players').child(val));
  //         player.$loaded(function(obj) {
  //           $scope.tableHeader.push(obj.name);
  //         })
  //       })
  //     }
  //   })
  // })

  let allPlayers = $firebaseArray(db.child('players'));
  allPlayers.$loaded(function(players) {
    players.forEach(function(player) {
      player.isChecked = false;
    })
    $scope.players = players;
  });

  $scope.numberOfRounds = 0;

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
        $scope.playerArray = initializePlayerNameArray(draftPlayers);
      });
    });
  };

  function initializePlayerNameArray(players) {
    var arr = [];
    players.forEach(function(player) {
      arr.push(player.name);
    });
  };

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