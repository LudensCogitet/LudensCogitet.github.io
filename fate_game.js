// © John Hiner 2022

/* Item 
 * $id
 * The unique string that identifies the item (in tokens, etc.)
 * 
 * $name
 * How the item will be refered to (in inventory, for instance)
 * 
 * $terms
 * Words that can be used to refer to the item
 * 
 * $location
 * A reference to the current room the item is in.
 * If this is null, the item may be in FATE.inventory, or nowhere
 * 
 * $triggers
 * Key / Value pairs where the key is the command that will cause the trigger
 * and the value is a function that will be executed when triggered.
 * This function can return a string (which will be added to the displayed texted and be clickable)
 * or an object {header?: string, content?: string, clear?: boolean}.
 * 'header' will replace the title in the UI.
 * 'content' will be added to the text in the UI.
 * Setting thec clear flag will remove all text from the UI, meaning whatever is in 'content' will
 * be the only thing on screen besides the header, verbs, and inventory. 
 * 
*/

/* Room
 * $id
 * the unique string that identifies the item (in exits, etc.)
 * 
 * $name
 * How the room will be refered to in the header.
 * 
 * $inventory
 * The items that start out in this room. Stores actual reference to item.
 * 
 * $triggers
 * (See description under Item above)
 * 
 * $exits
 * Key / Value pairs where the key is the word used for the exit,
 * and the value is the $id of the room the exit leads to. See the move() command.
 * 
 * $enterRoom
 * A function that is called when this room is entered (simplest would be to assign the basic
 * "look" trigger function to this variable.)
 * 
*/

FATE.load('front_hall', function () {
    const TURNS_TO_SUNSET = 45;
    const START_HOURS = 5;
    const START_MINUTES = 08;

    const SUNSET_HOURS = 5;
    const SUNSET_MINUTES = START_MINUTES + TURNS_TO_SUNSET;
    
    const VERBS = ['Look', 'Inventory', '\n', 'Take', 'Drop', 'Open', 'Close', '\n', 'Flip', 'On', 'Off', 'Wait', 'Shoot'];

    FATE.data['sun_is_set'] = false;
    FATE.data['power_is_on'] = false;
    FATE.data['flashlight_is_on'] = false;
    FATE.data['bullet_blessed'] = false;
    FATE.data['revolver_loaded'] = false;

    FATE.data['monster_location'] = null;
    FATE.data['room_paths'] = {
        'front_hall': ['dining_room', 'parlor', '2nd_floor_hall', 'basement'],
        'parlor': ['dining_room', 'front_hall'],
        'dining_room': ['kitchen', 'parlor', 'front_hall'],
        'basement': ['front_hall'],
        'kitchen': ['dining_room'],
        '2nd_floor_hall': ['sitting_room', 'office', 'front_hall'],
        'sitting_room': ['bedroom', '2nd_floor_hall', 'office'],
        'office': ['sitting_room', '2nd_floor_hall', 'alcove'],
        'alcove': ['office'],
        'bedroom': ['sitting_room']
    };

    FATE.data['monster_entry_points'] = ['front_hall', 'kitchen', 'bedroom', 'parlor', 'office'];

    FATE.data['switch_states'] = {
        'front_hall':       false,
        'parlor':           false,
        'dining_room':      false,
        '2nd_floor_hall':   false,
        'sitting_room':     false,
        'office':           false,
        'alcove':           false,
        'bedroom':          false,
        'kitchen':          false,
        'basement':         false
    };

    FATE.data['room_lights'] = {
        'front_hall':       false,
        'parlor':           false,
        'dining_room':      false,
        '2nd_floor_hall':   false,
        'sitting_room':     false,
        'office':           false,
        'alcove':           false,
        'bedroom':          false,
        'kitchen':          false,
        'basement':         false
    };

    function showTime() {
        let hours = START_HOURS;
        let minutes = START_MINUTES + FATE.ticks;
        
        if (minutes >= 60) {
            hours++;
            minutes = minutes % 60;
        }

        if (hours > 12) {
            hours -= 12;
        }

        return `It is ${hours}:${minutes < 10 ? '0' + minutes : minutes}.\n`+
               (FATE.data['sun_is_set'] ? 'The night has come.' : `${TURNS_TO_SUNSET - FATE.ticks} minutes to sunset.`);
    }

    function mentionLight() {
        if (FATE.data['sun_is_set']) {
            if (FATE.data['room_lights'][FATE.currentRoom]) {
                return 'The room is bright.';
            } else {
                return FATE.data['flashlight_is_on'] ? 'Shadows leap back as the beam of your flashlight sweeps through the darkness.' :
                                                       'It is nearly pitch black.';
            }   
        } else {
            if (FATE.data['room_lights'][FATE.currentRoom]) {
                return 'The room is bright.';
            } else {
                return FATE.data['flashlight_is_on'] ? 'Shadows leap back as the beam of your flashlight sweeps through the gloom.' :
                                                        'Only the failing light of the setting sun brightens the room.';
            }   
        }
    }

    function setExitVerbs(exits = []) {
        FATE.setVerbs([...VERBS, '\n', ...exits]);
    }

    function listRoomInventory(room) {
        return FATE.listInventory(room, {prefix: 'There is', suffix: 'here.', outro: '\n'});
    }

    function roomSwitch(state = null) {
        const newVal = state === null ? !FATE.data['switch_states'][FATE.currentRoom] : state;

        FATE.data['switch_states'][FATE.currentRoom] = newVal;
        if (FATE.data['power_is_on']) {
            FATE.data['room_lights'][FATE.currentRoom] = newVal;

            let text;
            if (FATE.data['sun_is_set']) {
                if (newVal) {
                    text = "The lights are on. The darkness flees.";
                } else {
                    text = "The lights are off. The darkness decends.";
                }
            } else {
                if (newVal) {
                    text = "The lights are on. The shadows flee.";
                } else {
                    text = "The lights are off. Shadows emerge.";
                }
            }
            return text;
        } else {
            return "Nothing happens. The power must be out."
        }
    }

    const roomSwitchOn = roomSwitch.bind(null, true);
    const roomSwitchOff = roomSwitch.bind(null, false);

    FATE.setVerbs(VERBS);

    FATE.addGlobalTrigger({
        'wait': () => 'You wait...',
        'inventory': () => FATE.listInventory('{inventory}', {intro: '\nYou have:', outro: '\n', nothing: "\nYou aren't carrying anything.\n"}),
        'flip switch': roomSwitch,
        'switch on|on switch': roomSwitchOn,
        'switch off|off switch': roomSwitchOff
    });

    FATE.setOnCommand(function() {
        if (!FATE.data['sun_is_set']) {
            if (FATE.ticks > (SUNSET_MINUTES - START_MINUTES)) {
                FATE.data['sun_is_set'] = true;
            
                for (const room of Object.keys(FATE.data['room_lights'])) {
                    FATE.data['room_lights'][room] = FATE.data['power_is_on'] && FATE.data['switch_states'][room];
                }
    
                return 'The sun sets' + (FATE.data['room_lights'][FATE.currentRoom] ? '.' : ', leaving you in gloom.');
            }

            return '';
        }

        if (!FATE.data['monster_location']) {
            const possibleEntry = FATE.data['monster_entry_points'].filter(x => !FATE.data['room_lights'][x]);
            const entry = possibleEntry.length && possibleEntry[Math.floor(Math.random() * possibleEntry.length)];
            if (!entry) {
                return "You hear a horrible gibbering, a sound beyond your powers to describe. It's coming from somewhere outside the house.";
            }

            FATE.data['monster_location'] = entry;
            return "You hear a horrible gibbering, a sound beyond your powers to describe. It's coming from inside the house.";
        }

        const paths = [];
        
        let path = [];
        const tracePath = (room) => {
            if (path.includes(room)) {
                return;
            }

            path.push(room);

            if (FATE.currentRoom === room) {
                paths.push([...path]);
                path.pop();
                return;
            }

            for (const next of FATE.data['room_paths'][room]) {
                tracePath(next);
            }
            path.pop();
        };

        tracePath(FATE.data['monster_location']);
        if (!paths.length) {
            return "";
        }

        let closest = -1;
        for (let i = 0; i < paths.length; i++) {  
            if (FATE.data['room_lights'][paths[i][1]]) {
                continue;
            }

            if (closest === -1 || paths[closest].length > paths[i].length) {
                closest = i;
            }
        }

        if (closest > -1) {
            FATE.data['monster_location'] = paths[closest][1];
        }

        if (FATE.data['monster_location'] === FATE.currentRoom) {
            return FATE.enterRoom('game_over');
        } else if (FATE.data['room_paths'][FATE.data['monster_location']].includes(FATE.currentRoom)) {
            const room_name = FATE.rooms[FATE.data['monster_location']].$name.toLowerCase();
            const light_description = FATE.data['room_lights'][Date.currentRoom] ? 'just beyond the light' : 'lurking in the darkness'
            return `In the ${room_name}, ${light_description}, you see a writhing, glistening form. The mere suggestion of its outline brings you near madness.`;
        }

        return "A horrid lurching, slimey sound tells you the unnamed thing is moving...";
    });

    FATE.addRoom('front_hall', function () {
        this.$name = 'Front Hall';
        this.$inventory = [];
        this.$triggers = {
            'look': () => {
                setExitVerbs(['North', 'East', 'Up', 'Down']);
                return "You are in the front hall of Dr. Willow's townhouse.\n"+
                       "All is still and silent but for the ticking of an ornate grandfather clock in the corner.\n\n"+
                       
                       mentionLight()+"\n\n"+
                       
                       "There is a light switch on the wall.\n\n"+

                       "You can see the dining room to the north.\n"+
                       "The parlor is through a door to the east.\n"+
                       "Stairs here lead up to the second floor.\n"+
                       "A door under the stairs conceals the way down to the basement.\n\n" +
                
                       listRoomInventory('front_hall');
            },
            'look clock': () => showTime()
        };
        this.$exits = {
            'north|dining room': 'dining_room',
            'east|parlor': 'parlor',
            'down|basement': 'basement',
            'up': '2nd_floor_hall'
        };
    });

    FATE.addItem('holy_water', function() {
        this.$name = 'phial of holy water';
        this.$terms = ['phial', 'water'];
        this.$triggers = {
            'look {this}': () => "It is a phial of holy water."
        };
    });

    FATE.addRoom('parlor', function () {
        this.$name = 'Parlor';
        this.$inventory = [];

        this.safe_door_open = false;
        this.safe_locked = true;

        const open_safe_door = () => {
            if (this.safe_door_open) {
                return "It is already open.";
            }
            this.safe_door_open = true;
            return "The false books swing to one side, revealing a small black safe with a dial combination lock.";
        };

        const close_safe_door = () => {
            if (!this.safe_door_open) {
                return "It is already closed.";
            }
            this.safe_door_open = false;
            return "You swing the false books back into place, hiding the safe.";
        };

        const open_safe = () => {
            if (!this.safe_locked) {
                return "The safe has already been unlocked.";
            }
            
            this.safe_door_open = true;
            this.safe_locked = false;
            FATE.teleportItem('holy_water', 'parlor');
            console.log(FATE.items['holy_water'], this.$inventory);
            return "You unlock and open the safe, revealing a small phial filled with pure water and adorned with a golden cross.";
        };

        this.$triggers = {
            'look': () => {
                setExitVerbs(['North', 'West']);
                return "You are in the parlor.\n\n" +
                       
                       mentionLight()+"\n\n"+
                       
                       "A floor to ceiling bookcase lines one side of the room.\n"+
                       (this.safe_door_open ? 'A false front has been opened, revealing a small black safe with a dial combination lock.\n' : '')+
                       "There is a light switch on the wall.\n\n"+
         
                       "A doorway to the north leads to the dining room.\n"+
                       "To the west is the front hall.\n\n"+

                       listRoomInventory('parlor');
            },
            'look bookcase': () => "A plethora scientific, philosophical, and historical treatise, "+
                                   "including a set of identically bound volumes on the history of the Church, sit well kept on the shelves.",
            '[open,look] [set,front,volumes]': open_safe_door,
            'close [set,front,volumes]': close_safe_door,

            '3 3 1': open_safe,
            '[dial,combination] 3 3 1': open_safe,
        };
        this.$exits = {
            'north': 'dining_room',
            'doorway': 'dining_room',

            'west': 'front_hall',
            'hall': 'front_hall'
        };
    });

    FATE.addItem('9mm_cartridge', function() {
        this.$name = '9mm cartridge';
        this.$terms = ['cartridge', 'bullet'];

        const bless_bullet = () => {
            if (FATE.data['bullet_blessed']) {
                return "You've done all you can to sanctify the bullet.";
            }

            if (!FATE.haveItem('holy_water')) {
                return '';
            }

            FATE.data['bullet_blessed'] = true;
            return "You sprinkle a few drops of the holy water onto the cartridge as you say a silent prayer.";
        }

        this.$triggers = {
            'look {this}': () => "It's a cartridge for a 9mm handgun." + (FATE.data['bullet_blessed'] ? " It's been sprinkled with holy water." : ''),
            '{holy_water} {this}|{this} {holy_water}': bless_bullet,
        };
    });

    FATE.addRoom('dining_room', function () {
        this.cartridge_found = false;

        this.$name = 'Dining Room';
        this.$inventory = [];

        const reveal_cartridge = () => {
            if (this.cartridge_found) {
                return "You find nothing more of interest.";
            };
            
            this.cartridge_found = true;
            FATE.teleportItem('9mm_cartridge', 'dining_room');
            return "In one of the drawers of the sideboard you find a single 9mm handgun cartridge. Odd.";
        };

        this.$triggers = {
            'look': () => {
                setExitVerbs(['North', 'East', 'South'])
                return "A large mahogany dining table fills most of the room.\n"+
                        "in the middle of the far wall is a sideboard of the same rich, dark wood.\n\n"+
                    
                        mentionLight()+"\n\n"+
                    
                        "There is a light switch on the wall.\n\n"+
                
                        "The kitchen is north.\n"+
                        "The parlor is to the east.\n"+
                        "The front hall is south.\n\n"+
            
                        listRoomInventory('dining_room')
            },
            'look sideboard': reveal_cartridge,
            'open sideboard': reveal_cartridge
        };
        this.$exits = {
            'north|kitchen': 'kitchen',
            'east|parlor': 'parlor',
            'south|hall': 'front_hall',
        };
    });

    FATE.addRoom('2nd_floor_hall', function () {
        this.$name = '2nd Floor Hall';
        this.$inventory = [];
        this.$triggers = {
            'look': () => {
                setExitVerbs(['East', 'South', 'Down']);
                return "You are in the hall on the second floor.\n\n"+
                       
                        mentionLight()+"\n\n"+
                    
                        "There is a light switch on the wall.\n\n"+
    
                        "Stairs here lead down to the front hall.\n"+
                        "You can see a small sitting room to the east.\n"+
                        "South is Dr. Willow's Office.\n\n"+

                        listRoomInventory('2nd_floor_hall');
            }
        };
        this.$exits = {
            'east': 'sitting_room',    
            'south|office': 'office',
            'down|hall': 'front_hall',
        };
    });


    FATE.addRoom('sitting_room', function () {
        this.$name = 'Sitting Room';
        this.$inventory = [];
        this.$triggers = {
            'look': () => {
                setExitVerbs(['North', 'West', 'South']);
                return "You are in a small sitting room on the second floor.\n\n"+
                       
                        mentionLight()+"\n\n"+
                    
                        "There is a light switch on the wall.\n\n"+
    
                        "From here you can reach Dr. Willow's bedroom to the north,\n"+
                        "his office to the south,\n"+
                        "and the 2nd floor hall to the west.\n\n"+
            
                        listRoomInventory('sitting_room');
            }
        };
        this.$exits = {
            'north|bedroom': 'bedroom',
            'west|hall': '2nd_floor_hall',
            'south|office': 'office',
        };
    });

    FATE.addRoom('office', function () {
        this.$name = 'Office';
        this.$inventory = [];
        this.$triggers = {
            'look': () => {
                setExitVerbs(['North', 'Northwest', 'West']);
                return "You are in Dr. Willow's office.\n\n"+
                       
                        mentionLight()+"\n\n"+
                    
                        "There is a light switch on the wall.\n\n"+
    
                        "The sitting room is to the north.\n"+
                        "To the northwest is the 2nd floor hall.\n"+
                        "There's also a little alcove to the west.\n\n"+
            
                        listRoomInventory('office');
            }
        };
        this.$exits = {
            'north': 'sitting_room',
            'northwest|hall': '2nd_floor_hall',
            'west|alcove': 'alcove',
        };
    });
    
    FATE.addRoom('alcove', function () {
        this.$name = 'Alcove';
        this.$inventory = [];
        this.$triggers = {
            'look': () => {
                setExitVerbs(['East']);
                return "You are in a small alcove off of Dr. Willow's office.\n\n"+
                                       
                        mentionLight()+"\n\n"+
                            
                        "There is a light switch on the wall.\n\n"+

                        "Dr. Willow's office is to the east.\n\n"+
    
                        listRoomInventory('alcove');
            }
        };
        this.$exits = {
            'east': 'office',
            'office': 'office'
        };
    });
    
    FATE.addItem('revolver', function () {
        this.$name = 'revolver';
        this.$terms = ['revolver'];

        const load_revolver = () => {
            if (FATE.data['revolver_loaded']) {
                return "You don't have any more bullets.";
            }

            if (!FATE.haveItem('9mm_cartridge')) {
                return "";
            }

            FATE.data['revolver_loaded'] = true;
            FATE.teleportItem('9mm_cartridge');
            return "You load the revolver.";
        };

        const shoot_revolver = () => {
            if (!FATE.data['room_paths'][FATE.data['monster_location']].includes(FATE.currentRoom)) {
                return '';
            }

            if (!FATE.data['revolver_loaded']) {
                return "*click* The gun is empty.";
            }

            if (!FATE.data['bullet_blessed']) {
                FATE.data['revolver_loaded'] = false;
                return "With a deafening bang the bullet flies into the writhing mass of the horror, to no effect."
            }

            return FATE.enterRoom('win');
        };

        this.$triggers = {
            'look {this}': () => FATE.data['revolver_loaded'] ? "Dr. Willow's revolver. It is loaded with a single cartridge." : "Dr. Willow's revolver. It is empty.",
            '{9mm_cartridge} {this}|{this} {9mm_cartridge}': load_revolver,
            'take {9mm_cartridge}': () => {
                if (!FATE.data['revolver_loaded']) {
                    return '';
                }

                FATE.data['revolver_loaded'] = false;
                FATE.teleportItem('9mm_cartridge', '{inventory}');
                return "You remove the cartridge";
            },
            'shoot [form,outline]': shoot_revolver,
        }
    });

    FATE.addRoom('bedroom', function () {
        this.$name = 'Bedroom';
        this.$inventory = [];

        this.nightstand_checked = false;
        
        const reveal_gun = () => {
            if (this.nightstand_checked) {
                return "Nothing more of interest.";
            }

            this.nightstand_checked = true;
            FATE.teleportItem('revolver', 'bedroom');
            return "You find Dr. Willow's revolver in the drawer of the nightstand.";
        };

        this.$triggers = {
            'look': () => {
                setExitVerbs(['South']);
                return "You are in Dr. Willow's bedroom.\n"+
                        "There is a nightstand by the bed.\n\n"+
                    
                        mentionLight()+"\n\n"+
                    
                        "There is a light switch on the wall.\n\n"+
    
                        "The sitting room is to the south.\n\n"+
                                        
                        listRoomInventory('bedroom');
            },
            '[look,open] nightstand': reveal_gun,
        };
        this.$exits = {
            'south|room': 'sitting_room',
        };
    });

    FATE.addItem('battery', function() {
        this.$name = '9 volt battery';
        this.$terms = ['battery'];
        this.$triggers = {
            'look {this}': () => "It's a 9 volt battery"
        };
    });
    
    FATE.addItem('flashlight', function() {
        this.has_battery = false;
        
        const insert_battery = () => {
            if (this.has_battery) {
                return "There's already a fresh battery.";
            } else if (!FATE.haveItem('battery')) {
                return "You don't have a battery.";
            }

            this.has_battery = true;
            FATE.teleportItem('battery');
            return "You put the new battery in the flashlight.";
        };

        const flashlight_on = () => {
            if (!this.has_battery) {
                return "There's no battery.";
            } else if (FATE.data['flashlight_is_on']) {
                return "It's already on.";
            }

            FATE.data['flashlight_is_on'] = true;
            return "You turn on the flashlight";
        };

        const flashlight_off = () => {
            if (!this.has_battery) {
                return "There's no battery.";
            } else if (!FATE.data['flashlight_is_on']) {
                return "It's already off.";
            }

            FATE.data['flashlight_is_on'] = false;
            return "You turn off the flashlight";
        };

        this.$name = 'flashlight';
        this.$terms = ['flashlight'];
        this.$triggers = {
            'look {this}': () => "It's a good size black flashlight.",
            'on {this}|{this} on': flashlight_on,
            'off {this}|{this} off': flashlight_off,
            '{this} {battery}|{battery} {this}': insert_battery,
        };
    });

    FATE.addRoom('kitchen', function () {
        this.found_battery = false;

        this.$name = 'Kitchen';
        this.$inventory = ['flashlight'];

        function cabinets() {
            if (this.found_battery) {
                return "Nothing of interest.";
            }

            this.found_battery = true;
            FATE.teleportItem('battery', 'kitchen');

            return "You find a 9 volt battery.";
        }

        this.$triggers = {
            'look': () => {
                setExitVerbs(['South']);
                return "You are in the kitchen.\n"+
                        "White cabinets line the walls.\n\n"+
                    
                        mentionLight()+"\n\n"+
                    
                        "There is a light switch on the wall.\n\n"+
    
                        "The dining room is to the south.\n\n"+
            
                        listRoomInventory('kitchen');
            },
            '[look,open] cabinets': cabinets,
        };
        this.$exits = {
            'south': 'dining_room'
        };
    });
    
    FATE.addRoom('basement', function () {
        const look_breaker_box = () => FATE.data['power_is_on'] ? 'The main breaker is on.' : 'Someone turned off the main breaker.';
        const flip_breaker = (turn_on = null) => {
            if (FATE.data['power_is_on'] === turn_on) {
                return turn_on ? 'The breaker is already on.' : 'The breaker is already off.';
            }

            FATE.data['power_is_on'] = turn_on === false ? false :
                                       turn_on === true ? true :
                                       !FATE.data['power_is_on'];
            
            for (const room of Object.keys(FATE.data['room_lights'])) {
                FATE.data['room_lights'][room] = FATE.data['power_is_on'] ? FATE.data['switch_states'][room] : !FATE.data['sun_is_set'];
            }

            return turn_on == true ? 'You turn on the breaker.' :
                   turn_on == false ? 'You turn off the breaker.' :
                   'You flip the breaker.';
        };

        const flip_breaker_on = flip_breaker.bind(null, true);
        const flip_breaker_off = flip_breaker.bind(null, false);

        this.$name = 'Basement';
        this.$inventory = [];
        this.$triggers = {
            'look': () => {
                setExitVerbs(['Up']);
                if (!FATE.data['room_lights']['basement'] && !FATE.data['flashlight_is_on']) {
                    return "It is pitch black down here.\n\n"+
                           
                           "Nothing to do but go back up."
                }

                return "You are in the Basement.\n"+
                       "There is a breaker box on the wall nearby.\n\n"+
                       
                        mentionLight()+"\n\n"+
                            
                        "There is a light switch on the wall.\n\n"+

                        "Stairs lead up to the front hall.\n\n"+

                        listRoomInventory('basement');
            },
            '[look,open] [breaker,box]': look_breaker_box,
            'on breaker|breaker on': flip_breaker_on,
            'off breaker|breaker off': flip_breaker_off,
            'flip breaker': flip_breaker
        };
        this.$exits = {
            '[up,back,hall]': 'front_hall'
        };
    });

    FATE.addRoom('game_over', function () {
        this.$name = 'Game Over';
        this.$inventory = [];
        this.$triggers = {
            'look': () => "With the suddenness of a lightning strike you are seized in the iron, cloying, crawling grip of some... thing.\n"+
                          "Just as suddenly your mind breaks.\n\n"+

                          `You lost after ${FATE.ticks} turns. Please click Restart Game to try again.`
            }
        this.$exits = {};
    });

    FATE.addRoom('win', function () {
        this.$name = 'You Win!';
        this.$inventory = [];
        this.$triggers = {
            'look': () => "As the blessed bullet pierces the horror's repulive flesh, a deafing shriek fills the air and is suddenly cut off.\n"+
                          "The miasma lifts. The thing is gone. Now their's nothing to do but wait for Dr. Willow and ask him what comes next.\n\n"+
                        
                          `Congratulations! You won in ${FATE.ticks} turns.`
            }
        this.$exits = {};
    });

    FATE.addItem('dr_willow_letter', function() {
        this.$name = 'letter from Dr. Willow';
        this.$terms = ['letter'];
        this.$triggers = {
            'look {this}': () => "You read the letter:\n"+
                                 "\"Dear Fredrick,\n\n"+
                                 "You do not have much time. The vile presence I've written of before has become far more than a presentiment of dread. "+
                                 "While you have the phylactery it will hunt for you, and you must not abandon the phylactery.\n\n"+

                                 "Go to my townhouse. There you will find 3 things you will need to banish it, at least for a time.\n\n"+

                                 "First: Light. It abhors the light, and to abide long anywhere in our world it must have gloom and shadow.\n\n"+

                                 "Second: My revolver. You will find it in the nightstand by my bed.\n\n"+

                                 "3: Holy water. There is a phial, very precious to me, hidden in the house. You must find my safe.\n\n"+

                                 "Mere weapons will have no effect on this thing, but it hates blessed things more than it hates the light."+
                                 "At the touch of something holy it will flee our world for a time, I am sure of it. However, you mustn't get near it yourself. Keep away at all costs!\n\n"+

                                 "Banish this horror, my boy, and with God's help I will meet you there as soon as I can. After that, there is only 1 way to proceed.\n\n"+

                                 "Yours,\n\n"+

                                 "Dr. Arthur Willow\""
        };
    });

    FATE.addItem('phylactery', function() {
        this.$name = 'phylactery';
        this.$terms = ['phylactery'];
        this.$triggers = {
            'look {this}': () => "How does one describe the Unknown?",
            'look unknown': () => "Braver men have looked, and gone mad."
        }
    });

    FATE.inventory.push('dr_willow_letter');
    FATE.inventory.push('phylactery');
});
