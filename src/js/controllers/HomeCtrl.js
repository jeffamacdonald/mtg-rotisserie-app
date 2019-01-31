(function() {

angular
  .module('rotoDraftApp')
  .controller('HomeCtrl', HomeCtrl);

HomeCtrl.$inject = ['$scope','$firebaseArray','$firebaseObject','activeDraftService','cubeService'];

function HomeCtrl($scope,$firebaseArray,$firebaseObject,activeDraftService,cubeService) {
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

  let allCubes = $firebaseArray(db.child('cubes'));
  allCubes.$loaded(function(cubes) {
    cubes.forEach(function(cube) {
      cube.isChecked = false;
    });
    $scope.cubes = cubes;
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
        let cube = $scope.cubes.filter(function(cube) {
          return cube.isChecked == true;
        });
        angular.forEach(cube[0].cards, function(value,key) {
          $firebaseArray(newDraftRef.child('draftPool')).$add(value);
        })

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
    if(card.colors == undefined && card.types == undefined) {
      return;
    } else if((card.colors != undefined && card.colorIdentity.length == 2 && card.layout == 'transform' && card.colorIdentity[1] == 'W') || 
      (card.colors != undefined && card.colorIdentity[0] == 'W' && card.colorIdentity.length == 1)) {
      return {background:'white',color:'black'};
    } else if((card.colors != undefined && card.colorIdentity.length == 2 && card.layout == 'transform' && card.colorIdentity[1] == 'U') || 
      (card.colors != undefined && card.colorIdentity[0] == 'U' && card.colorIdentity.length == 1)) {
      return {background:'blue'};
    } else if((card.colors != undefined && card.colorIdentity.length == 2 && card.layout == 'transform' && card.colorIdentity[1] == 'B') || 
      (card.colors != undefined && card.colorIdentity[0] == 'B' && card.colorIdentity.length == 1)) {
      return {background:'black'};
    } else if((card.colors != undefined && card.colorIdentity.length == 2 && card.layout == 'transform' && card.colorIdentity[1] == 'R') || 
      (card.colors != undefined && card.colorIdentity[0] == 'R' && card.colorIdentity.length == 1)) {
      return {background:'#ff0000'};
    } else if((card.colors != undefined && card.colorIdentity.length == 2 && card.layout == 'transform' && card.colorIdentity[1] == 'G') || 
      (card.colors != undefined && card.colorIdentity[0] == 'G' && card.colorIdentity.length == 1)) {
      return {background:'green'};
    } else if(card.colors != undefined && card.layout != 'transform' && card.colorIdentity.length > 1) {
      return {background:'#e6c300',color:'black'};
    } else if(arrayContains(card.types,'Land')) {
      return {background:'#ffa64d',color:'black'};
    } else {
      return {background:'grey'};
    }
  }

  function arrayContains(arr,str) {
    return (arr.indexOf(str) > -1);
  };

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

  // let cardList = "Frenzied Goblin|Mogg Fanatic|Orcish Lumberjack|Lightning Bolt|Goblin Grenade|Firebolt|Galvanic Blast|Skirk Drill Sergeant|Ember Hauler|Goblin Wardriver|Mogg War Marshal|Sparksmith|Atog|Embersmith|Generator Servant|Goblin Lookout|Incinerate|Shrapnel Blast|Searing Blaze|Dragon Fodder|Krenko's Command|Tribal Flames|Arms Dealer|Spikeshot Goblin|Gempalm Incinerator|Goblin Artillery|Goblin Matron|Dragonsoul Knight|Orcish Mechanics|Hissing Iguanar|Brimstone Volley|Arc Lightning|Hordeling Outburst|Furnace Celebration|Honden of Infinite Rage|Beetleback Chief|Tar Pitcher|Scrapyard Mongrel|Treasonous Ogre|Kird Chieftain|Goblin Heelcutter|Solar Blast|Aftershock|Barrage Ogre|Emrakul's Hatcher|Pyrotechnics|Kuldotha Flamefiend|Rapacious One|Chartooth Cougar|Rolling Thunder|Fireball|Disciple of the Vault|Carnophage|Diregraf Ghoul|Typhoid Rats|Gnarled Scarhide|Shambling Goblin|Executioner's Capsule|Duress|Dark Ritual|Salvage Slasher|Knight of Infamy|Dauthi Slayer|Blind Creeper|Spiteful Returned|Fallen Askari|Augur of Skulls|Mesmeric Fiend|Bile Blight|Chainer's Edict|Doom Blade|Sign in Blood|Gatekeeper of Malakir|Bone Shredder|Phyrexian Rager|Necrogen Scudder|Cadaver Imp|Liliana's Specter|Vampire Nighthawk|Ichor Slick|Read the Bones|Drag Down|Murder|Drown in Sorrow|Moriok Scavenger|Disciple of Phenax|Squelching Leeches|Paragon of Open Graves|Liliana's Shade|Faceless Butcher|Tendrils of Corruption|Pestilence|Moan of the Unhallowed|Honden of Night's Reach|Gray Merchant of Asphodel|Warren Pilferers|Nightfire Giant|Mind Sludge|Dead Ringers|Twisted Abomination|Corrupt|Enslave|Avacyn's Pilgrim|Llanowar Elves|Elves of Deep Shadow|Joraga Treespeaker|Experiment One|Sunblade Elf|Prey Upon|Rancor|Vines of Vastwood|Sakura-Tribe Elder|Strangleroot Geist|Kalonian Tusker|Wild Mongrel|Shinen of Life's Roar|Sylvan Ranger|Wall of Blossoms|Albino Troll|River Boa|Mire Boa|Rampant Growth|Lignify|Sprout Swarm|Epic Confrontation|Naturalize|Civic Wayfinder|Yavimaya Elder|Grazing Gladehart|Matca Rioters|Imperious Perfect|Leatherback Baloth|Citanul Woodreaders|Cultivate|Elephant Guide|Beast Within|Kozilek's Predator|Penumbra Spider|Blastoderm|Briarhorn|Rhox Charger|Gaea's Embrace|Acidic Slime|Garruk's Packleader|Sentinel Spider|Honden of Life's Web|Baloth Woodcrasher|Durkwood Baloth|Deadwood Treefolk|Tromp the Domains|Krosan Tusker|Jungle Weaver|Pelakka Wurm|Elite Vanguard|Mardu Woe-Reaper|Steppe Lynx|Hopeful Eidolon|Akrasan Squire|Gideon's Lawkeeper|Dispeller's Capsule|Knight of Meadowgrain|Soltari Priest|Accorder Paladin|Cloistered Youth|Lone Missionary|Ajani's Pridemate|Dauntless River Marshal|Sigiled Paladin|Syndic of Tithes|Wall of Omens|Myrsmith|Aven Squire|Knight of Glory|Journey to Nowhere|Otherworldly Journey|Disenchant|Pacifism|Guardians of Akrasa|Flickerwisp|Fiend Hunter|Banisher Priest|Kor Sanctifiers|Attended Knight|Sandsteppe Outcast|Stonecloaker|Oblivion Ring|Arrest|Empyrial Armor|Griffin Guide|Blinding Beam|Sanctum Gargoyle|Auriok Salvagers|Glimmerpoint Stag|Master Splicer|Celestial Crusader|Faith's Fetters|Honden of Cleansing Fire|Cloudgoat Ranger|Guardian of the Gateless|Serra Angel|Gleam of Resistance|Noble Templar|Urbis Protector|Phantasmal Bear|Delver of Secrets|Nephalia Smuggler|Enclave Cryptologist|Preordain|Ponder|Silent Departure|Azure Mage|Welkin Tern|Vaporkin|Augur of Bolas|Frost Walker|Merfolk Looter|Narcolepsy|Essence Scatter|Mana Leak|Think Twice|Trinket Mage|Man-o'-War|Pestermite|Civilized Scholar|Jorubai Murk Lurker|Sea Gate Oracle|Prodigal Sorcerer|Calcite Snapper|Esperzoa|Claustrophobia|Dissolve|Stoic Rebuttal|Complicate|Thirst for Knowledge|Compulsive Research|Wing Splicer|Faerie Mechanist|Master Thief|Thieving Magpie|Ninja of the Deep Hours|Foresee|Wash Out|Ray of Command|Sleep|Riftwing Cloudskate|Mulldrifter|Air Servant|Mind Control|Traumatic Visions|Honden of Seeing Winds|Aethersnipe|Jetting Glasskite|Opportunity|Power Sink|Feudkiller's Verdict|Arcbound Worker|Chronomaton|Signal Pest|Origin Spellbomb|Panic Spellbomb|Pyrite Spellbomb|Bonesplitter|Trusty Machete|Arcbound Slith|Arcbound Stinger|Myr Retriever|Epochrasite|Myr Sire|Perilous Myr|Immolating Souleater|Gust-Skimmer|Spined Thopter|Necropede|Porcelain Legionnaire|Prophetic Prism|Ichor Wellspring|Mycosynth Wellspring|Mind Stone|Sylvok Replica|Cathodion|Palladium Myr|Pilgrim's Eye|Blinding Souleater|Kiln Walker|Moriok Replica|Skeleton Shard|Sickleslicer|Arcbound Hybrid|Etched Oracle|Juggernaut|Cogwork Librarian|Pierce Strider|Pith Driller|Slash Panther|Icy Manipulator|Serrated Arrows|Dross Golem|Clone Shell|Arcbound Bruiser|Skyreach Manta|Strandwalker|Darksteel Sentinel|Geistcatcher's Rig|Dreamstone Hedron|Tangle Golem|Ulamog's Crusher|Momentary Blink|Ardent Plea|Lyev Skyknight|Ethercaste Knight|Glassdust Hulk|Mortify|Pillory of the Sleepless|Tidehollow Sculler|Rally the Peasants|Flamewright|Warleader's Helix|Behemoth Sledge|Dryad Militant|Enlisted Wurm|Qasali Pridemage|Selesnya Evangel|Agony Warp|Warped Physique|Soul Manipulation|Tidehollow Strix|Moroii|Frostburn Weird|Izzet Charm|Izzet Chronarch|Beetleform Mage|Coiling Oracle|Snakeform|Bituminous Blast|Blightning|Terminate|Murderous Redcap|Spike Jester|Consume Strength|Dreg Mangler|Putrefy|Boggart Ram-Gang|Branching Bolt|Ghor-Clan Rampager|Savage Twister|Vengeful Rebirth|Fusion Elemental|Frontier Bivouac|Mystic Monastery|Nomad Outpost|Opulent Palace|Sandsteppe Citadel|Arcane Sanctum|Crumbling Necropolis|Jungle Shrine|Savage Lands|Seaside Citadel|Buried Ruin|Urza's Factory|Dread Statuary";

  // // turn cardlist into array
  // let cardArray = cardList.split("|");
  // for (var i = 0; i < cardArray.length; i++) {
  //   cardArray[i] = cardArray[i].trim();
  // }
  // cubeService.createNewCube(cardArray,'Alex\'s Pauper Cube');
}
})();