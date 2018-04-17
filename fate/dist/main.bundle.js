webpackJsonp(["main"],{

/***/ "../fate/fate.js":
/***/ (function(module, exports, __webpack_require__) {

let util = __webpack_require__("./node_modules/util/util.js");

let pristineWorld;
let world;
let started = false;

let command;
let response = [];

let playerMoved = false;
let actionTaken = false;
let objectNames = [];

// 'plus': 'add',
// 'minus': 'subtract',
// 'divided by': 'divide',
// 'multiplied by': 'multiply',
// 'remainder of division by': 'modulo'

function resolveModifier(subject) {
	if(!subject.modifier) return subject.value;

	let {operation} = subject.modifier;
	let operand = resolveOperand(subject.modifier.operand);

	if(operation === 'add')
		return Number(subject.value) + Number(operand);
	if(operation === 'subtract')
		return Number(subject.value) - Number(operand);
	if(operation === 'divide')
		return Number(subject.value) / Number(operand);
	if(operation === 'multiply')
		return Number(subject.value) * Number(operand);
	if(operation === 'modulo')
		return Number(subject.value) % Number(operand);
}

function resolveValue(operand) {
	if(operand.value) {
		let value = Number(operand.value);
		if(value || value === 0) return value;
		else {
			return operand.value;
		}
	}

	if(operand.variable) return resolveValue(world.variables[operand.variable]);
}

function resolveOperand(operand) {
	if(!operand.hasOwnProperty('value') && !operand.hasOwnProperty('variable')) return false;

	if(operand.value === '#here') return world.things['#player'].location;
	if(operand.value === '#command') return command;

	let resolved = {
		value: resolveValue(operand)
	};

	if(operand.modifier) resolved.modifier = operand.modifier;

	return resolveModifier(resolved);
}

function processIf(subject) {
	let comparisons = [subject.if];
	let results = [];
	if(subject.or) comparisons = comparisons.concat(subject.or);

	for(let comparison of comparisons) {
		if(comparison.eq) {
			results.push(resolveOperand(comparison.eq[0]) === resolveOperand(comparison.eq[1]));
		} else if(comparison.neq) {
			results.push(resolveOperand(comparison.neq[0]) !== resolveOperand(comparison.neq[1]));
		} else if(comparison.in) {
			results.push(world.things[resolveOperand(comparison.in[0])].location === resolveOperand(comparison.in[1]));
		} else if(comparison.nin) {
			results.push(world.things[resolveOperand(comparison.nin[0])].location !== resolveOperand(comparison.nin[1]));
		}
	}

	return results.some(x => x);
}

function processDo(subject) {
	subject.forEach(x => {
		process(x);
	});
}

function processTravel(subject) {
	let newLocation = resolveOperand(subject);
	world.things['#player'].location = newLocation;
	playerMoved = true;
}

function processSay(subject) {
	subject.forEach(x => {
		let value = resolveOperand(x);
		if(value) {
			response.push(value);
			return;
		}
		process(x);
	});
}

function processMove(subject) {
	let thing = resolveOperand(subject[0]);
	let destination = resolveOperand(subject[1]);

	world.things[thing].location = destination;
}

function processSet(subject) {
	world.variables[resolveOperand(subject[0])] = subject[1];
}

function processList(subject) {
	let location = resolveValue(subject.location);
	let phrase = resolveValue(subject.phrase);
	let things = Object.keys(world.things).filter(x => world.things[x].location === location);

	things.forEach(thing => response.push(phrase.replace('#thing', world.things[thing].description)));
}

function processAction(subject) {
	let actions = {
		"travel": processTravel,
		"say": processSay,
		"move": processMove,
		"set": processSet,
		"list": processList
	};

	for(let action of Object.keys(actions)) {
		if(subject[action]) {
			actionTaken = true;
			actions[action](subject[action]);
			break;
		}
	}
}

function process(subject) {
	if(subject.do)
		processDo(subject.do);
	else if(subject.if){
		if(processIf(subject)) {
			process(subject.then);
		} else if(subject.else) {
			process(subject.else);
		}
	} else {
		processAction(subject);
	}
}

function getThingsAtLocation(location) {
	let thingsAtLocation = [];

	let thingNames = Object.keys(world.things);

	for(let thing of thingNames) {
		if(world.things[thing].location === location)
			thingsAtLocation.push(thing);
	}

	return thingsAtLocation;
}

function checkPlayerMoved() {
	if(!playerMoved) return;
	playerMoved = false;
	command = '#enter';
	process(world.places[world.things['#player'].location]);
}

function filterCommand(newCommand) {
	if(newCommand === '#enter') return newCommand;
	let {keywords} = world.settings;

	let words = [];

	keywords.forEach(keyword => {
		words.push(keyword.keyword);
		if(keyword.synonyms) {
			keyword.synonyms.forEach(synonym => {
				newCommand = newCommand.replace(synonym, keyword.keyword);
			});
		}
	});

	let matches = [];

	words.concat(objectNames).forEach(word => {
		 let match = newCommand.match(new RegExp(`.*(${word}).*`));
		 if(match) matches.push(match);
	});

	return matches.map(x => x[1]).sort((a, b) => newCommand.indexOf(a) - newCommand.indexOf(b)).join(' ');
}

function load(worldString) {
	pristineWorld = worldString;
	world = JSON.parse(worldString);

	objectNames = objectNames.concat(Object.keys(world.things), Object.keys(world.places));
}

function move(newCommand) {
	if(!world || !started) return;
	command = newCommand;
	// if(world.settings.keywords) {
	// 	command = filterCommand(newCommand);
	// } else {
	// 	command = newCommand;
	// }

	let anywhere				= world['#anywhere'];
	let currentPlace 		= world.places[world.things['#player'].location];
	let localThings			= getThingsAtLocation(world.things['#player'].location);
	let playerThings		= getThingsAtLocation('#player');

	process(currentPlace);
	localThings.forEach(x => {
		process(world.things[x]);
	});

	playerThings.forEach(x => {
		process(world.things[x]);
	});
	process(anywhere);

	checkPlayerMoved();

	let compiledResponse = !actionTaken ? world.settings.onBadCommand : response.join(' ');

	response = [];

	if((!world.settings.registerTurn || world.settings.registerTurn === 'input') || actionTaken) {
		world.variables['#turn'].value = ((+world.variables['#turn'].value) + 1) + ''
	}

	let packet = {
		response: compiledResponse,
		world,
		currentLocation: {
			name: world.things['#player'].location,
			description: resolveValue(world.places[world.things['#player'].location].description)
		},
		actionTaken
	};
	actionTaken = false;
	return packet;
}

function start() {
	if(!world) return;
	started = true;

	return move(`#enter`);
}

module.exports = { load, move, start }


/***/ }),

/***/ "./src/$$_lazy_route_resource lazy recursive":
/***/ (function(module, exports) {

function webpackEmptyAsyncContext(req) {
	// Here Promise.resolve().then() is used instead of new Promise() to prevent
	// uncatched exception popping up in devtools
	return Promise.resolve().then(function() {
		throw new Error("Cannot find module '" + req + "'.");
	});
}
webpackEmptyAsyncContext.keys = function() { return []; };
webpackEmptyAsyncContext.resolve = webpackEmptyAsyncContext;
module.exports = webpackEmptyAsyncContext;
webpackEmptyAsyncContext.id = "./src/$$_lazy_route_resource lazy recursive";

/***/ }),

/***/ "./src/app/app.component.css":
/***/ (function(module, exports) {

module.exports = ".container {\n\tdisplay: -webkit-box;\n\tdisplay: -ms-flexbox;\n\tdisplay: flex;\n\t-webkit-box-pack: center;\n\t    -ms-flex-pack: center;\n\t        justify-content: center;\n\n\theight: 90vh;\n}\n\n.inner-container {\n\tdisplay: -webkit-box;\n\tdisplay: -ms-flexbox;\n\tdisplay: flex;\n\t-webkit-box-orient: vertical;\n\t-webkit-box-direction: normal;\n\t    -ms-flex-direction: column;\n\t        flex-direction: column;\n\tbackground-color: black;\n\theight: 100%;\n\twidth: 411px;\n\n\tpadding: 10px 10px 10px 10px\n}\n\n.text {\n\t-webkit-box-flex: 1;\n\t    -ms-flex-positive: 1;\n\t        flex-grow: 1;\n\toverflow: auto;\n}\n\n.commands {\n\tborder-top: 2px solid green;\n\tpadding-top: 10px;\n\ttext-align: center;\n\t-webkit-user-select: none;\n\t   -moz-user-select: none;\n\t    -ms-user-select: none;\n\t        user-select: none;\n}\n\n.commands span {\n\tmargin-left: 10px;\n\tmargin-right: 10px;\n}\n"

/***/ }),

/***/ "./src/app/app.component.html":
/***/ (function(module, exports) {

module.exports = "<div class=\"container\">\n\t<div class=\"inner-container\">\n\t\t<div class=\"text\" #text>\n\t\t\t<p *ngFor=\"let paragraph of paragraphs\">\n\t\t\t\t<app-clickable \t*ngFor=\"let word of paragraph\"\n\t\t\t\t\t\t\t\t\t\t\t\t[data]=\"extractWordData(word)\">\n\t\t\t \t</app-clickable>\n\t\t\t<p>\n\t\t</div>\n\t\t<div class=\"commands\">\n\t\t\t<app-clickable *ngFor=\"let keyword of keywords\" [isButton]=\"true\" [data]=\"extractWordData(keyword, keywordAliases)\"></app-clickable>\n\t\t</div>\n\t</div>\n</div>\n"

/***/ }),

/***/ "./src/app/app.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__fate_service__ = __webpack_require__("./src/app/fate.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__assets_world__ = __webpack_require__("./src/assets/world.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var AppComponent = /** @class */ (function () {
    function AppComponent(fateService) {
        this.fateService = fateService;
        this.aliases = [];
        this.keywordAliases = [];
        this.paragraphs = [];
    }
    AppComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.gameStateSub = this.fateService.$gameState.subscribe(function (gameState) {
            if (!gameState)
                return;
            if (!_this.keywords) {
                _this.getKeywords(gameState);
            }
            _this.lastRoom = _this.currentRoom;
            _this.currentRoom = gameState.currentLocation.name;
            if (gameState.response) {
                if (_this.lastRoom !== _this.currentRoom) {
                    _this.aliases = [];
                    _this.paragraphs = [];
                    _this.paragraphs.push(_this.getAliases(gameState.currentLocation.description).split(' '));
                }
                else {
                    _this.paragraphs.push(["\"" + gameState.lastCommandDisplay + "\""]);
                }
                gameState.response.split('<p>').forEach(function (paragraph) {
                    _this.paragraphs.push(_this.getAliases(paragraph).split(' '));
                });
            }
            else {
                _this.paragraphs.push(["\"" + gameState.lastCommandDisplay + "\""]);
            }
        });
        this.fateService.load(__WEBPACK_IMPORTED_MODULE_2__assets_world__["a" /* world */]);
    };
    AppComponent.prototype.ngOnDestroy = function () {
        if (this.gameStateSub)
            this.gameStateSub.unsubscribe();
    };
    AppComponent.prototype.ngAfterViewChecked = function () {
        this.textWindow.nativeElement.scrollTop = this.textWindow.nativeElement.offsetHeight + 100000;
    };
    AppComponent.prototype.extractWordData = function (text, storage) {
        if (storage === void 0) { storage = this.aliases; }
        var match = text.match(/{([0-9]+)}/);
        if (!match) {
            return { content: text };
        }
        return storage[+match[1]];
    };
    AppComponent.prototype.getAliases = function (text, storage) {
        if (storage === void 0) { storage = this.aliases; }
        var match = text.match(/{(.*)\|(.*)}/);
        while (match) {
            storage.push({ display: match[1], content: match[2] });
            text = text.replace(match[0], "{" + (storage.length - 1) + "}");
            match = text.match(/{(.*)\|(.*)}/);
        }
        return text;
    };
    AppComponent.prototype.getKeywords = function (gameState) {
        var _this = this;
        this.keywords = gameState.world.settings.keywords.map(function (x) { return _this.getAliases(x.keyword, _this.keywordAliases); });
    };
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_3" /* ViewChild */])('text'),
        __metadata("design:type", __WEBPACK_IMPORTED_MODULE_0__angular_core__["r" /* ElementRef */])
    ], AppComponent.prototype, "textWindow", void 0);
    AppComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* Component */])({
            selector: 'app-root',
            template: __webpack_require__("./src/app/app.component.html"),
            styles: [__webpack_require__("./src/app/app.component.css")]
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1__fate_service__["a" /* FateService */]])
    ], AppComponent);
    return AppComponent;
}());



/***/ }),

/***/ "./src/app/app.module.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_platform_browser__ = __webpack_require__("./node_modules/@angular/platform-browser/esm5/platform-browser.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_forms__ = __webpack_require__("./node_modules/@angular/forms/esm5/forms.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__app_component__ = __webpack_require__("./src/app/app.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__fate_service__ = __webpack_require__("./src/app/fate.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__clickable_clickable_component__ = __webpack_require__("./src/app/clickable/clickable.component.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};






var AppModule = /** @class */ (function () {
    function AppModule() {
    }
    AppModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_1__angular_core__["E" /* NgModule */])({
            declarations: [
                __WEBPACK_IMPORTED_MODULE_3__app_component__["a" /* AppComponent */],
                __WEBPACK_IMPORTED_MODULE_5__clickable_clickable_component__["a" /* ClickableComponent */]
            ],
            imports: [
                __WEBPACK_IMPORTED_MODULE_0__angular_platform_browser__["a" /* BrowserModule */],
                __WEBPACK_IMPORTED_MODULE_2__angular_forms__["a" /* FormsModule */]
            ],
            providers: [
                __WEBPACK_IMPORTED_MODULE_4__fate_service__["a" /* FateService */]
            ],
            bootstrap: [__WEBPACK_IMPORTED_MODULE_3__app_component__["a" /* AppComponent */]]
        })
    ], AppModule);
    return AppModule;
}());



/***/ }),

/***/ "./src/app/clickable/clickable.component.css":
/***/ (function(module, exports) {

module.exports = "button {\n\tcolor: green;\n\tbackground-color: black;\n\tmargin: 5px 5px 5px 5px;\n\tpadding: 10px 10px 10px 10px;\n\tborder-color: green;\n\tborder-radius: 2px;\n}\n\nbutton:hover {\n\tbackground-color: green;\n\tcolor: black;\n}\n\nbutton:active {\n\tbackground-color: green;\n\tcolor: white;\n}\n\nspan {\n\tcolor: green;\n}\n\nspan:hover {\n\tcolor: white;\n\tcursor: pointer;\n}\n\n.selected {\n\tcolor: white;\n\tfont-size: 1.1em;\n\tfont-weight: bold;\n}\n"

/***/ }),

/***/ "./src/app/clickable/clickable.component.html":
/***/ (function(module, exports) {

module.exports = "<span *ngIf=\"!isButton\" [ngClass]=\"{selected: selected}\" (click)=\"clicked()\">{{display}}</span>\n<button *ngIf=\"isButton\" [ngClass]=\"{selected: selected}\" (click)=\"clicked()\">{{display}}</button>\n"

/***/ }),

/***/ "./src/app/clickable/clickable.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ClickableComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__fate_service__ = __webpack_require__("./src/app/fate.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var ClickableComponent = /** @class */ (function () {
    function ClickableComponent(fateService) {
        this.fateService = fateService;
        this.selected = false;
        this.isButton = false;
    }
    ClickableComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.display = this.data.display || this.data.content;
        this.content = this.data.content.replace(/[.,:]/g, '');
        this.gameStateSub = this.fateService.$gameState.subscribe(function (gameState) {
            _this.selected = false;
            console.log("hello");
        });
    };
    ClickableComponent.prototype.ngOnDestroy = function () {
        if (this.gameStateSub)
            this.gameStateSub.unsubscribe();
    };
    ClickableComponent.prototype.clicked = function () {
        this.selected = !this.selected;
        console.log("CONTENT", this.content);
        if (this.selected) {
            this.fateService.move({ display: this.display, content: this.content });
        }
        else {
            this.fateService.clearFromBuffer({ display: this.display, content: this.content });
        }
    };
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["z" /* Input */])(),
        __metadata("design:type", Object)
    ], ClickableComponent.prototype, "data", void 0);
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["z" /* Input */])(),
        __metadata("design:type", Boolean)
    ], ClickableComponent.prototype, "isButton", void 0);
    ClickableComponent = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* Component */])({
            selector: 'app-clickable',
            template: __webpack_require__("./src/app/clickable/clickable.component.html"),
            styles: [__webpack_require__("./src/app/clickable/clickable.component.css")]
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1__fate_service__["a" /* FateService */]])
    ], ClickableComponent);
    return ClickableComponent;
}());



/***/ }),

/***/ "./src/app/fate.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return FateService; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_rxjs_Subject__ = __webpack_require__("./node_modules/rxjs/_esm5/Subject.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__fate_fate__ = __webpack_require__("../fate/fate.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__fate_fate___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__fate_fate__);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var FateService = /** @class */ (function () {
    function FateService() {
        this.gameState = new __WEBPACK_IMPORTED_MODULE_1_rxjs_Subject__["a" /* Subject */]();
        this.commandBuffer = [];
        this.displayBuffer = [];
        this.$gameState = this.gameState.asObservable();
    }
    FateService.prototype.load = function (worldString) {
        this.worldString = worldString;
        __WEBPACK_IMPORTED_MODULE_2__fate_fate__["load"](worldString);
        this.gameState.next(__WEBPACK_IMPORTED_MODULE_2__fate_fate__["start"]());
    };
    FateService.prototype.restart = function () {
        this.load(this.worldString);
    };
    FateService.prototype.move = function (command) {
        this.displayBuffer = this.displayBuffer.concat(command.display);
        this.commandBuffer = this.commandBuffer.concat(command.content.split(' '));
        if (this.commandBuffer.length > 1) {
            var lastCommandDisplay = this.displayBuffer.join(' ... ');
            var result = __WEBPACK_IMPORTED_MODULE_2__fate_fate__["move"](this.commandBuffer.join(' '));
            result.lastCommandDisplay = lastCommandDisplay;
            this.gameState.next(result);
            this.commandBuffer = [];
            this.displayBuffer = [];
        }
    };
    FateService.prototype.clearFromBuffer = function (command) {
        var displayIndex = this.displayBuffer.indexOf(command.display);
        var commandIndex = this.commandBuffer.indexOf(command.content);
        if (commandIndex > -1) {
            this.commandBuffer.splice(commandIndex, 1);
        }
        if (displayIndex > -1) {
            this.displayBuffer.splice(displayIndex, 1);
        }
    };
    FateService = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["w" /* Injectable */])(),
        __metadata("design:paramtypes", [])
    ], FateService);
    return FateService;
}());



/***/ }),

/***/ "./src/assets/world.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return world; });
var world = "{\"#anywhere\":{\"do\":[{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"check inventory\"}]},\"then\":{\"list\":{\"location\":{\"value\":\"#player\"},\"phrase\":{\"value\":\"You have #thing.\"}}}},{\"if\":{\"eq\":[{\"modifier\":{\"operation\":\"modulo\",\"operand\":{\"variable\":\"time_cycle_length\"}},\"variable\":\"#turn\"},{\"value\":\"0\"}]},\"then\":{\"if\":{\"eq\":[{\"variable\":\"time_of_day\"},{\"value\":\"day\"}]},\"then\":{\"do\":[{\"set\":[{\"value\":\"time_of_day\"},{\"value\":\"night\"}]},{\"say\":[{\"value\":\"<p>The morning sun has vanquished the horrible night.<p>\"}]}]},\"else\":{\"if\":{\"eq\":[{\"variable\":\"time_of_day\"},{\"value\":\"night\"}]},\"then\":{\"do\":[{\"set\":[{\"value\":\"time_of_day\"},{\"value\":\"day\"}]},{\"say\":[{\"value\":\"<p>What a horrible night to have a curse.<p>\"}]}]}}}}]},\"places\":{\"pedestal_room\":{\"description\":{\"value\":\"{Pedestal Room|pedestal_room}\"},\"do\":[{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"go north\"}]},\"or\":[{\"eq\":[{\"value\":\"#command\"},{\"value\":\"go to the other room\"}]}],\"then\":{\"travel\":{\"value\":\"cube_room\"}}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"go south\"}]},\"then\":{\"if\":{\"eq\":[{\"variable\":\"cube_in_pedestal\"},{\"value\":\"true\"}]},\"then\":{\"travel\":{\"value\":\"you_win\"}}}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"look around\"}]},\"or\":[{\"eq\":[{\"value\":\"#command\"},{\"value\":\"#enter\"}]}],\"then\":{\"say\":[{\"say\":[{\"value\":\"You are standing in a small circular room with bare white walls.\"}]},{\"if\":{\"eq\":[{\"variable\":\"cube_in_pedestal\"},{\"value\":\"false\"}]},\"then\":{\"say\":[{\"value\":\"In the center of the room is a small, waist-high pedestal with a square depression in the center.\"}]}},{\"if\":{\"eq\":[{\"variable\":\"cube_in_pedestal\"},{\"value\":\"true\"}]},\"then\":{\"say\":[{\"value\":\"In the center of the room is a small, waist-high pedestal. A matte black {cube|strange_cube} sits in a square depression in the center.\"}]}},{\"say\":[{\"value\":\"To the north a doorway leads into another small room beyond.\"}]}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"strange_cube pedestal\"}]},\"then\":{\"if\":{\"eq\":[{\"variable\":\"cube_in_pedestal\"},{\"value\":\"false\"}]},\"then\":{\"if\":{\"in\":[{\"value\":\"strange_cube\"},{\"value\":\"#player\"}]},\"then\":{\"do\":[{\"say\":[{\"say\":[{\"value\":\"You place the {cube|strange_cube} in the depression on the pedestal.\"}]},{\"say\":[{\"value\":\"It slides in easily and clicks into place.\"}]},{\"set\":[{\"value\":\"cube_in_pedestal\"},{\"value\":\"true\"}]},{\"move\":[{\"value\":\"strange_cube\"},{\"value\":\"#here\"}]}]}]}}}}]},\"cube_room\":{\"description\":{\"value\":\"{Alcove|cube_room}\"},\"do\":[{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"go south\"}]},\"then\":{\"travel\":{\"value\":\"pedestal_room\"}}},{\"if\":{\"in\":[{\"value\":\"strange_cube\"},{\"value\":\"#here\"}]},\"then\":{\"do\":[{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"look around\"}]},\"or\":[{\"eq\":[{\"value\":\"#command\"},{\"value\":\"#enter\"}]}],\"then\":{\"say\":[{\"value\":\"A small black {cube|strange_cube} sits in an alcove in this otherwise featureless room.\"}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"use strange_cube\"}]},\"then\":{\"do\":[{\"say\":[{\"value\":\"You take the {cube|strange_cube}.\"}]},{\"move\":[{\"value\":\"strange_cube\"},{\"value\":\"#player\"}]}]}}]}},{\"if\":{\"nin\":[{\"value\":\"strange_cube\"},{\"value\":\"#here\"}]},\"then\":{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"look around\"}]},\"or\":[{\"eq\":[{\"value\":\"#command\"},{\"value\":\"#enter\"}]}],\"then\":{\"say\":[{\"value\":\"An empty alcove is the only notable feature of this otherwise featureless room.\"}]}}}]},\"you_win\":{\"description\":{\"value\":\"{You Win!|you_win}\"},\"do\":[{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"look around\"}]},\"or\":[{\"eq\":[{\"value\":\"#command\"},{\"value\":\"#enter\"}]}],\"then\":{\"say\":[{\"value\":\"YOU WIN!\"}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"go north\"}]},\"then\":{\"travel\":{\"value\":\"pedestal_room\"}}}]}},\"things\":{\"#player\":{\"location\":\"pedestal_room\"},\"strange_cube\":{\"location\":\"cube_room\",\"description\":\"{a small black cube|strange_cube}\",\"do\":[{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"examine strange_cube\"}]},\"then\":{\"say\":[{\"value\":\"It's a small matte black {cube|strange_cube}, perfectly smooth and about 2 inches on a side\"}]}}]}},\"variables\":{\"cube_in_pedestal\":{\"value\":\"false\"},\"time_cycle_length\":{\"value\":\"7\"},\"time_of_day\":{\"value\":\"day\"},\"#turn\":{\"value\":\"1\"}},\"settings\":{\"registerTurn\":\"input\",\"commandsPerTurn\":\"2\",\"keywords\":[{\"keyword\":\"use\"},{\"keyword\":\"examine\"},{\"keyword\":\"look around\"},{\"keyword\":\"{inventory|check inventory}\"},{\"keyword\":\"{north|go north}\"},{\"keyword\":\"{south|go south}\"},{\"keyword\":\"{east|go east}\"},{\"keyword\":\"{west|go west}\"}]}}";


/***/ }),

/***/ "./src/environments/environment.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return environment; });
// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.
var environment = {
    production: false
};


/***/ }),

/***/ "./src/main.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("./node_modules/@angular/core/esm5/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_platform_browser_dynamic__ = __webpack_require__("./node_modules/@angular/platform-browser-dynamic/esm5/platform-browser-dynamic.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__app_app_module__ = __webpack_require__("./src/app/app.module.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__environments_environment__ = __webpack_require__("./src/environments/environment.ts");




if (__WEBPACK_IMPORTED_MODULE_3__environments_environment__["a" /* environment */].production) {
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_8" /* enableProdMode */])();
}
Object(__WEBPACK_IMPORTED_MODULE_1__angular_platform_browser_dynamic__["a" /* platformBrowserDynamic */])().bootstrapModule(__WEBPACK_IMPORTED_MODULE_2__app_app_module__["a" /* AppModule */])
    .catch(function (err) { return console.log(err); });


/***/ }),

/***/ 0:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__("./src/main.ts");


/***/ })

},[0]);
//# sourceMappingURL=main.bundle.js.map