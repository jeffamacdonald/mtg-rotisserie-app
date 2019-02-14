(function() {

angular
  .module('rotoDraftApp')
  .controller('HomeCtrl', HomeCtrl);

HomeCtrl.$inject = ['$scope','activeDraftService','cubeService','activeDraft','newDraftService'];

function HomeCtrl($scope,activeDraftService,cubeService,activeDraft,newDraftService) {
  let settingsModal = document.getElementById('draft-settings-dialog');

  let allDrafters = activeDraftService.getAllDrafters(activeDraft);
  $scope.playerArray = allDrafters;

  let allPlayers = newDraftService.getAllPlayers();
  allPlayers.$loaded(function(players) {
    players.forEach(function(player) {
      player.isChecked = false;
    })
    $scope.players = players;
  });

  let allCubes = newDraftService.getAllCubes();
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
    newDraftService.startNewDraft($scope.cubes,$scope.players,$scope.numberOfRounds);
  }

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

  allDrafters.$watch(function() {
    $scope.draftPicks = activeDraftService.getDraftArray(activeDraft,allDrafters);
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

  // let cardList = "Tundra|Scrubland|Plateau|Savannah|Underground Sea|Volcanic Island|Tropical Island|Badlands|Bayou|Taiga|Hallowed Fountain|Godless Shrine|Sacred Foundry|Temple Garden |Watery Grave|Steam Vents|Breeding Pool|Blood Crypt|Overgrown Tomb|Stomping Ground|Flooded Strand|Marsh Flats|Arid Mesa |Windswept Heath|Polluted Delta|Scalding Tarn|Misty Rainforest|Bloodstained Mire|Verdant Catacombs|Wooded Foothills|Celestial Colonnade|Shambling Vent|Needle Spires|Stirring Wildwood|Creeping Tar Pit|Wandering Fumarole|Lumbering Falls|Lavaclaw Reaches|Hissing Quagmire|Raging Ravine|Mishra's Factory|City of Brass|Gemstone Mine|Evolving Wilds|Terramorphic Expanse|Mana Confluence|Forbidden Orchard|Undiscovered Paradise|Library of Alexandria|Ancient Tomb|City of Traitors|Strip Mine|Wasteland|Rishadan Port|Bazaar of Baghdad|Maze of Ith|Mishra's Workshop|Westvale Abbey|The Tabernacle at Pendrell Vale|Darksteel Citadel|Black Lotus|Mox Sapphire|Mox Emerald|Mox Jet|Mox Pearl|Mox Ruby|Mana Crypt|Mox Diamond|Chrome Mox|Zuran Orb|Voltaic Key|Sol Ring|Mana Vault|Sensei's Divining Top|Skullclamp|Cursed Scroll|Bonesplitter|Relic of Progenitus|Lightning Greaves|Cranial Plating|Anvil of Bogardan|Grim Monolith|Umezawa's Jitte|Scroll Rack|Ankh of Mishra|Altar of Dementia|Sphere of Resistance|Mind Stone|Winter Orb|Chaos Orb|Coalition Relic|Crucible of Worlds|Tangle Wire |Worn Powerstone|Sword of Fire and Ice|Horn of Greed|Sword of Light and Shadow|Sword of Feast and Famine|Mimic Vat|Ensnaring Bridge|Grafted Wargear|Sands of Delirium|Thran Dynamo|Smokestack|Nevinyrral's Disk|Phyrexian Processor|Erratic Portal|Gilded Lotus|Memory Jar|Karn Liberated|All Is Dust|Everflowing Chalice |Engineered Explosives |Hangarback Walker|Emrakul, the Aeons Torn|Ulamog, the Ceaseless Hunger|Sundering Titan|Myr Battlesphere|Wurmcoil Engine|Scuttling Doom Engine|Triskelion|Batterskull|Precursor Golem|Solemn Simulacrum|Lodestone Golem|Crystalline Crawler|Traxos, Scourge of Kroog|Metalworker|Cultivator's Caravan|Filigree Familiar|Foundry Inspector|Scrap Trawler|Spellskite|Phyrexian Revoker|Smuggler's Copter|Epochrasite|Arcbound Ravager|Metallic Mimic|Steel Overseer|Signal Pest|Karakas|Windbrisk Heights|Kytheon, Hero of Akros|Isamaru, Hound of Konda|Mother of Runes|Student of Warfare|Soldier of the Pantheon|Champion of the Parish|Dauntless Bodyguard|Swords to Plowshares|Path to Exile|Land Tax|Enlightened Tutor|Mana Tithe|Stoneforge Mystic|Porcelain Legionnaire|Thalia, Guardian of Thraben|Spirit of the Labyrinth|Leonin Relic-Warder|Wall of Omens|Imposing Sovereign|Accorder Paladin|Containment Priest|Gather the Townsfolk|Selfless Spirit|Thalia's Lieutenant|Squadron Hawk|Hanweir Militia Captain|Glory-Bound Initiate|Suture Priest|Balance|Revoke Existence|Disenchant|Journey to Nowhere|Monastery Mentor|Blade Splicer|Mirran Crusader|Brimaz, King of Oreskos|Banisher Priest|Fiend Hunter|Silverblade Paladin|Flickerwisp|Mirror Entity |Recruiter of the Guard|Thalia, Heretic Cathar|Soltari Champion|Loyal Retainers|Vryn Wingmare|History of Benalia|Oblivion Ring|Collective Effort|Ghostly Prison|Restoration Angel|Hero of Bladehold|Academy Rector|Gisela, the Broken Blade|Sram's Expertise|Armageddon|Elspeth, Knight-Errant|Faith's Fetters|Wrath of God|Parallax Wave|Angelic Destiny|Moat|Citadel Siege|Reveillark|Karmic Guide|Archangel of Thune|Archangel Avacyn|Angel of Invention|Death or Glory|Righteous Confluence|Elspeth, Sun's Champion|Akroma's Vengeance|Elesh Norn, Grand Cenobite|Angel of Serenity |Entreat the Angels|Secure the Wastes|Decree of Justice|Martial Coup|Tolarian Academy|Shelldock Isle|Enclave Cryptologist|Hedron Crab|Ancestral Recall|Brainstorm|Mystical Tutor|Ponder|Preordain|Force Spike|Spell Pierce|Snapcaster Mage |Jace, Vryn's Prodigy|Phantasmal Image|Gilded Drake|Thing in the Ice|Augur of Bolas|Mindshrieker|Time Walk|Copy Artifact|Dig Through Time|Chart a Course|Impulse|Mana Drain|Counterspell|Mana Leak|Daze|Remand|Negate|Vendilion Clique|Man-o'-War|Deceiver Exarch|Champion of Wits|Nimble Obstructionist|Master of Etherium|Jace's Archivist|Skaab Ruinator|Tinker|Capsize|Imprisoned in the Moon|Sphinx's Tutelage|Vedalken Shackles|Thirst for Knowledge|Frantic Search|Timetwister|Intuition|Forbid|Supreme Will |Exclude|Phyrexian Metamorph|Glen Elendra Archmage|Venser, Shaper Savant|Sower of Temptation|Control Magic|Whirler Rogue|Reef Worm|Opposition|Mechanized Production|Jace, the Mind Sculptor|Fact or Fiction|Deep Analysis|Gifts Ungiven|Cryptic Command|Mulldrifter|Meloku the Clouded Mirror|Clocknapper|Treachery|Tezzeret the Seeker|Sunder|Mystic Confluence|Gush|Force of Will|Pact of Negation|Consecrated Sphinx|Torrential Gearhulk|Upheaval|Palinchron|Inkwell Leviathan|Treasure Cruise|Increasing Confusion|Volrath's Stronghold|Cryptbreaker|Putrid Imp|Viscera Seer|Reanimate|Entomb|Vampiric Tutor|Thoughtseize|Duress|Dark Ritual|Fatal Push|Tragic Slip|Pack Rat|Mesmeric Fiend|Dark Confidant|Bloodghast|Blood Artist|Bitterblossom|Zulaport Cutthroat|Scrapheap Scrounger|Rotting Rats|Reassembling Skeleton|Animate Dead|Demonic Tutor|Hymn to Tourach|Sinkhole|Malicious Affliction|Go for the Throat|Smallpox|Night's Whisper|Collective Brutality|Vampire Nighthawk|Bone Shredder|Ophiomancer|Xathrid Necromancer|Pawn of Ulamog|Flesh Carver|Stinkweed Imp|Nighthowler|Undercity Informer|Undead Gladiator|Recurring Nightmare|Liliana of the Veil|Toxic Deluge|Necropotence|Hero's Downfall|Contamination|Bitter Ordeal|Victimize |Buried Alive|Skinrender|Braids, Cabal Minion|Crypt Ghast |Abyssal Persecutor |Disciple of Phenax|Xiahou Dun, the One-Eyed|Mindwrack Demon|Whip of Erebos|Damnation|Snuff Out|The Abyss|Sever the Bloodline|Tombstone Stairwell|Phyrexian Scriptures|Dread Return|Shriekmaw|Gray Merchant of Asphodel|Endrek Sahr, Master Breeder|Living Death|Palace Siege|Liliana, Death's Majesty|Grave Titan|Kokusho, the Evening Star|Noxious Gearhulk|Yawgmoth's Bargain|Abhorrent Overlord|Griselbrand|Dread Summons|Mind Twist|Battle at the Bridge|Spitfire Bastion|Goblin Guide|Grim Lavamancer|Zurgo Bellstriker|Greater Gargadon|Goblin Welder|Monastery Swiftspear|Legion Loyalist|Falkenrath Gorger|Lightning Bolt|Chain Lightning|Burst Lightning|Gamble|Faithless Looting|Vandalblast|Reckless Charge|Young Pyromancer|Stormblood Berserker|Mogg War Marshal|Torch Fiend|Ember Hauler|Harsh Mentor|Immolating Souleater|Earthshaker Khenra|Kari Zev, Skyship Raider|War-Name Aspirant|Goblin Bushwhacker|Incinerate|Magma Jet|Searing Blaze|Mizzium Mortars|Goblin Bombardment|Pyroclasm |Abrade|Arc Trail|Pyrewild Shaman|Shrine of Burning Rage|Goblin Rabblemaster|Imperial Recruiter|Hordeling Outburst|Pia Nalaar|Rampaging Ferocidon|Hissing Iguanar|Goblin Sharpshooter|Sin Prodder|Combat Celebrant|Sulfuric Vortex|Wheel of Fortune|Blast from the Past|Brimstone Volley |Kari Zev's Expertise|Rift Bolt|Collective Defiance|Dynacharge|Flametongue Kavu|Hero of Oxid Ridge|Avalanche Riders|Hellrider|Pia and Kiran Nalaar|Goblin Heelcutter|Purphoros, God of the Forge|Sneak Attack|Stoke the Flames|Daretti, Scrap Savant|Chandra, Torch of Defiance|Zealous Conscripts|Siege-Gang Commander|Kiki-Jiki, Mirror Breaker|Neheb, the Eternal|Sarkhan, the Dragonspeaker|Inferno Titan|Combustible Gearhulk|Wildfire|Fireblast|Chandra, Bold Pyromancer|Devastation|Bogardan Hellkite|Bonfire of the Damned|Devil's Play|Rolling Earthquake|Gaea's Cradle|Noble Hierarch|Birds of Paradise|Llanowar Elves|Joraga Treespeaker|Quirion Ranger|Arbor Elf|Worldly Tutor|Fastbond|Rancor|Berserk|Nature's Claim|Crop Rotation|Exploration|Blossoming Defense|Rofellos, Llanowar Emissary|Lotus Cobra|Sylvan Caryatid|Scavenging Ooze|Tarmogoyf|Wall of Blossoms|Wall of Roots|Sakura-Tribe Elder|Mayor of Avabruck|Priest of Titania|Hermit Druid|Duskwatch Recruiter|Bloom Tender|Satyr Wayfinder|Channel|Regrowth|Survival of the Fittest|Sylvan Library|Life from the Loam|Oath of Druids|Mulch|Nostalgic Dreams|Eternal Witness|Courser of Kruphix|Reclamation Sage|Den Protector|Call of the Herd|Elvish Archdruid|Tireless Tracker|Imperious Perfect|Fierce Empath|Kodama's Reach|Song of the Dryads|Beast Within|Search for Tomorrow|Oracle of Mul Daya|Polukranos, World Eater|Roar of the Wurm|Caller of the Untamed|Centaur Vinecrasher|Garruk Wildspeaker|Natural Order|Harmonize|Acidic Slime|Thragtusk|Deranged Hermit|Grizzly Fate|Golgari Grave-Troll|Titania, Protector of Argoth|Garruk, Primal Hunter|Plow Under|Primal Command|Stunted Growth|The Mending of Dominaria|Primeval Titan|Rampaging Baloths|Avenger of Zendikar|Regal Force|Hornet Queen|Tooth and Nail|Terastodon|Woodfall Primus|Craterhoof Behemoth|Green Sun's Zenith|Genesis Wave|Geist of Saint Traft|Reflector Mage|Spell Queller|Brago, King Eternal |Venser, the Sojourner|Migratory Route|Cloudblazer|Momentary Blink|Detention Sphere|Sphinx's Revelation |Lingering Souls|Vona, Butcher of Magan|Desolation Angel|Magister of Worth|Ashen Rider|Vindicate|Sorin, Lord of Innistrad|Utter End|Kaya, Ghost Assassin|Unburial Rites|Figure of Destiny|Bruse Tarl, Boorish Herder|Kalemne, Disciple of Iroas|Assemble the Legion|Lightning Helix|Boros Charm|Rally the Peasants|Ajani Vengeant|Huatli, Warrior Poet|Aurelia's Fury|Avacyn's Pilgrim|Voice of Resurgence|Qasali Pridemage|Gaddock Teeg|Saffi Eriksdotter|Kitchen Finks|Knight of the Reliquary|Gavony Township|Huatli, Radiant Champion|Mirari's Wake|Baleful Strix|Psychatog|Nightveil Specter|Hostage Taker|The Scarab God|Dragonlord Silumgar|Lim-Dûl's Vault|Glimpse the Unthinkable|Ashiok, Nightmare Weaver|Tezzeret, Agent of Bolas|Jhoira of the Ghitu|Herald of Kozilek|Keranos, God of Storms|Izzet Charm|Fire // Ice|Electrolyze|Ral Zarek|Izzet Chronarch|Brutal Expulsion|Prophetic Bolt|Wood Sage|Kiora's Follower|Trygon Predator|Shardless Agent|Kiora, the Crashing Wave|Master Biomancer|Simic Sky Swallower|Prophet of Kruphix|Memory's Journey|Tracker's Instincts|Grenzo, Dungeon Warden|Vial Smasher the Fierce|Murderous Redcap|Falkenrath Aristocrat|Dreadbore|Terminate|Blightning|Kolaghan's Command|Bituminous Blast|Rakdos's Return|Deathrite Shaman|Grim Flayer|Lotleth Troll|Life // Death|Maelstrom Pulse|Abrupt Decay|Squandered Resources|Pernicious Deed|Deadbridge Chant|Garruk, Apex Predator|Orcish Lumberjack|Flinthoof Boar|Bloodbraid Elf|Ghor-Clan Rampager|Huntmaster of the Fells|Kessig Wolf Run|Atarka's Command|Firespout|Xenagos, the Reveler|Vengeful Rebirth|Sphinx of the Steel Wind|Warden of the Eye|Roon of the Hidden Realm|Mardu Charm|Siege Rhino|Wild Nacatl|Nicol Bolas, the Ravager|Tasigur, the Golden Fang|Maelstrom Wanderer |Broodmate Dragon|Progenitus";

  // // turn cardlist into array
  // let cardArray = cardList.split("|");
  // for (var i = 0; i < cardArray.length; i++) {
  //   cardArray[i] = cardArray[i].trim();
  // }
  // cubeService.createNewCube(cardArray,'Power Jeff');
}
})();