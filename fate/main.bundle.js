webpackJsonp(["main"],{

/***/ "../fate/fate.js":
/***/ (function(module, exports, __webpack_require__) {

let util = __webpack_require__("./node_modules/util/util.js");

let pristineWorld;
let world;
let started = false;

let command;

let response = [];
let roomEnterResponse = [];

let interrupt;
let clear;

let travelToLocation;
let actionTaken = false;
let objectNames = [];

// 'plus': 'add',
// 'minus': 'subtract',
// 'divided by': 'divide',
// 'multiplied by': 'multiply',
// 'remainder of division by': 'modulo'

function resolveModifier(subject) {
	if(!subject.modifier) return resolveValue(subject);

	let {operation} = subject.modifier;
	let operand = resolveOperand(subject.modifier.operand);

	if(operation === 'add')
		return resolveValue(subject) + operand;
	if(operation === 'subtract')
		return resolveValue(subject) - operand;
	if(operation === 'divide')
		return resolveValue(subject) / operand;
	if(operation === 'multiply')
		return resolveValue(subject) * operand;
	if(operation === 'modulo')
		return resolveValue(subject) % operand;
}

function resolveValue(operand) {
	if(operand.variable) {
		return resolveValue(world.variables[operand.variable]);
	}

	let value = Number(operand.value);
	if(value || value === 0) {
		return value;
	} else {
		return operand.value;
	}
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

function wrapOperand(operand) {
	if(world.variables[operand]) return {variable: operand};

	return {value: operand};
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
	let toProcess = subject.function ? world.functions[resolveOperand(subject.function)] : subject;
	toProcess.forEach(x => {
		process(x);
	});
}

function processTravel(subject) {
	travelToLocation = resolveOperand(subject);
}

function processSay(subject) {
	subject.forEach(x => {
		let value = resolveOperand(x);
		if(value) {
			command === '#enter' ? roomEnterResponse.push(value) : response.push(value);
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
	world.variables[resolveOperand(subject[0])] = wrapOperand(resolveOperand(subject[1]));
}

function processList(subject) {
	let location = resolveOperand(subject.location);
	let phrase = resolveOperand(subject.phrase);
	let things = Object.keys(world.things).filter(x => world.things[x].location === location && x !== '#player');

	console.log("THINGS", things);

	things.forEach(thing => response.push(phrase.replace('#thing', world.things[thing].description)));
}

function processClear(subject) {
	console.log("CLEAR");
	clear = true;
	response = [];
}

function processAction(subject) {
	let actions = {
		"travel": processTravel,
		"say": processSay,
		"move": processMove,
		"set": processSet,
		"list": processList,
		"clear": processClear
	};

	for(let action of Object.keys(actions)) {
		if(subject[action]) {
			actionTaken = true;
			actions[action](subject[action]);
			interrupt = subject[action].interrupt;
			break;
		}
	}
}

function process(subject) {
	console.log("SUBJECT", subject);
	if(interrupt) return;
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
	if(!travelToLocation) return;

	interrupt = false;
	while(travelToLocation) {
		world.things['#player'].location = travelToLocation;
		travelToLocation = null;
		command = '#enter';
		process(world.places[world.things['#player'].location]);
	}
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

	response = roomEnterResponse.concat(response);
	let compiledResponse = !actionTaken ? world.settings.onBadCommand : response.join(' ');

	response = [];
	roomEnterResponse = [];
	interrupt = false;

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
		actionTaken,
		clear
	};
	clear = false;
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

module.exports = ".container {\n\tdisplay: -webkit-box;\n\tdisplay: -ms-flexbox;\n\tdisplay: flex;\n\t-webkit-box-pack: center;\n\t    -ms-flex-pack: center;\n\t        justify-content: center;\n\theight: 100vh;\n}\n\n.inner-container {\n\tdisplay: -webkit-box;\n\tdisplay: -ms-flexbox;\n\tdisplay: flex;\n\t-webkit-box-orient: vertical;\n\t-webkit-box-direction: normal;\n\t    -ms-flex-direction: column;\n\t        flex-direction: column;\n\tbackground-color: black;\n\n\theight: 480px;\n\twidth: 380px;\n\tmargin: auto;\n\n\tborder: 2px solid green;\n\n\tpadding: 10px 10px 10px 10px\n}\n\n.text {\n\t-webkit-box-flex: 1;\n\t    -ms-flex-positive: 1;\n\t        flex-grow: 1;\n\toverflow: auto;\n}\n\n.commands {\n\tborder-top: 2px solid green;\n\tpadding-top: 10px;\n\ttext-align: center;\n\t-webkit-user-select: none;\n\t   -moz-user-select: none;\n\t    -ms-user-select: none;\n\t        user-select: none;\n}\n\n.commands span {\n\tmargin-left: 10px;\n\tmargin-right: 10px;\n}\n"

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
            console.log(gameState);
            if (!_this.keywords) {
                _this.getKeywords(gameState);
            }
            _this.lastRoom = _this.currentRoom;
            _this.currentRoom = gameState.currentLocation.name;
            if (gameState.clear) {
                _this.aliases = [];
                _this.paragraphs = [];
            }
            if (gameState.response) {
                if (_this.lastRoom !== _this.currentRoom) {
                    _this.aliases = [];
                    _this.paragraphs = [];
                    _this.paragraphs.push(_this.getAliases(gameState.currentLocation.description).split(' '));
                }
                else {
                    _this.paragraphs.push([">> \"" + gameState.lastCommandDisplay + "\""]);
                }
                gameState.response.split('<p>').forEach(function (paragraph) {
                    _this.paragraphs.push(_this.getAliases(paragraph).split(' '));
                });
            }
            else {
                _this.paragraphs.push([">> \"" + gameState.lastCommandDisplay + "\""]);
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
        if (text.startsWith('>>'))
            return { content: text };
        var match = text.match(/\[([0-9]+?)\]/);
        if (!match) {
            var foundWord = text.match(/[\s,\w]+/);
            if (!foundWord)
                return { content: text };
            var data_1 = { content: foundWord[0] };
            var edges_1 = text.split(foundWord[0]);
            if (!edges_1.length)
                return data_1;
            if (edges_1.length === 1) {
                if (text.indexOf(edges_1[0]) < text.indexOf(foundWord[0]))
                    data_1.before = edges_1[0];
                else
                    data_1.after = edges_1[0];
            }
            if (edges_1.length === 2) {
                data_1.before = edges_1[0];
                data_1.after = edges_1[1];
            }
            return data_1;
        }
        var stored = storage[+match[1]];
        var data = {
            display: stored.display,
            content: stored.content
        };
        var edges = text.split(match[0]);
        if (!edges)
            return data;
        if (edges.length === 1) {
            if (text.indexOf(edges[0]) < text.indexOf(match[0]))
                data.before = edges[0];
            else
                data.after = edges[0];
        }
        if (edges.length === 2) {
            data.before = edges[0];
            data.after = edges[1];
        }
        return data;
    };
    AppComponent.prototype.getAliases = function (text, storage) {
        if (storage === void 0) { storage = this.aliases; }
        if (!text)
            return '';
        var match = text.match(/({.*?\|.*?})/);
        while (match) {
            var split = match[1].split('|');
            var display = split[0].slice(1);
            var content = split[1].slice(0, -1);
            storage.push({ display: display, content: content });
            text = text.replace(match[0], "[" + (storage.length - 1) + "]");
            match = text.match(/({.*?\|.*?})/);
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

module.exports = "button {\n\tcolor: green;\n\tbackground-color: black;\n\tmargin: 5px 5px 5px 5px;\n\tpadding: 10px 10px 10px 10px;\n\tborder-color: green;\n\tborder-radius: 2px;\n}\n\nbutton:hover {\n\tbackground-color: green;\n\tcolor: black;\n}\n\nbutton:active {\n\tbackground-color: green;\n\tcolor: white;\n}\n\nspan {\n\tcolor: green;\n}\n\n.clickable:hover {\n\tcolor: white;\n\tcursor: pointer;\n}\n\n.selected {\n\tcolor: white;\n\tfont-weight: bold;\n}\n\n.standOut {\n\ttext-decoration: underline;\n}\n"

/***/ }),

/***/ "./src/app/clickable/clickable.component.html":
/***/ (function(module, exports) {

module.exports = "<span *ngIf=\"!isButton\">\n\t{{data.before || ''}}<span [ngClass]=\"{selected: selected, clickable: clickable, standOut: isHighlighted}\" (click)=\"clicked()\">{{display}}</span>{{data.after || ''}}\n</span>\n<button *ngIf=\"isButton\" [ngClass]=\"{selected: selected}\" (click)=\"clicked()\">{{display}}</button>\n"

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
        if (this.data.content.slice(0, 2) === '>>') {
            this.clickable = false;
            console.log("HARGE", this.data.content);
        }
        else {
            this.clickable = true;
        }
        this.display = this.data.display || this.data.content;
        this.isHighlighted = this.display.startsWith('!!');
        if (this.isHighlighted)
            this.display = this.display.slice(2);
        this.content = this.data.content.replace(/[.,:]/g, '');
        this.gameStateSub = this.fateService.$gameState.subscribe(function (gameState) {
            _this.selected = false;
        });
    };
    ClickableComponent.prototype.ngOnDestroy = function () {
        if (this.gameStateSub)
            this.gameStateSub.unsubscribe();
    };
    ClickableComponent.prototype.clicked = function () {
        if (!this.clickable)
            return;
        this.selected = !this.selected;
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
var world = "{\"#anywhere\":{\"do\":[{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"check inventory\"}]},\"then\":{\"list\":{\"location\":{\"value\":\"#player\"},\"phrase\":{\"value\":\"You have #thing.<p>\"}}}}]},\"places\":{\"_intro\":{\"description\":\"\",\"do\":[{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"#enter\"}]},\"then\":{\"do\":[{\"say\":[{\"value\":\"A shadow hunts you. What had been but a vague and lurking fear, a scratching at the outer wall of the conscious mind,\"}]},{\"say\":[{\"value\":\"became a sudden reality after that terrible ritual. It had been folly to participate, you knew that now. And perhaps it had\"}]},{\"say\":[{\"value\":\"even been a trap set by Willem to destroy you, or to feed the thing? You could only guess, and there was no time now for guessing.<p>\"}]},{\"say\":[{\"value\":\"Only flight.<p>\"}]},{\"say\":[{\"value\":\"{Continue...|_intro_next 1}\"}]}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"_intro_next 1\"}]},\"then\":{\"do\":[{\"say\":[{\"value\":\"The Thing is only a step behind, but somehow you've made it this far. Dusk has fallen and you stand in the very street where\"}]},{\"say\":[{\"value\":\"Dr. Walter Sinclar lives; an expert in the occult and the only hope you have of freedom from your eldrich pursuer.\"}]},{\"say\":[{\"value\":\"Still clutching his letter in your hand, you stare wildly about you for the proper house.<p>\"}]},{\"say\":[{\"value\":\"{Continue...|_intro_next 2}\"}]}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"_intro_next 2\"}]},\"then\":{\"travel\":{\"value\":\"_street\"}}}]},\"_street\":{\"description\":{\"value\":\"{A Windy Street|_street}\"},\"do\":[{\"if\":{\"neq\":[{\"value\":\"#command\"},{\"value\":\"#enter\"}]},\"then\":{\"do\":{\"function\":{\"value\":\"_street_check_dead\"}}}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"look around\"}]},\"or\":[{\"eq\":[{\"value\":\"#command\"},{\"value\":\"#enter\"}]}],\"then\":{\"say\":[{\"say\":[{\"value\":\"Imposing houses, most with darkened windows, stand back from the pavement to the right and left of the empty street.<p>\"}]},{\"say\":[{\"value\":\"You see {!!a golden plaque|_right_hand_plaque} hanging from the garden wall next to the {!!gate of the house|_right_hand_gate} to the {!!east|go east}.<p>\"}]},{\"say\":[{\"value\":\"You see {!!another plaque|_left_hand_plaque} similarly placed next to {!!the gate|_left_hand_gate} across the street, to the {!!west|go west}.<p>\"}]},{\"say\":[{\"value\":\"The street continues {!!north|go north}, into the dark.\"}]}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"examine _left_hand_plaque\"}]},\"then\":{\"say\":[{\"value\":\"The plaque reads: \\\"380 Mayfair Street\\\"\"}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"examine _right_hand_plaque\"}]},\"then\":{\"say\":[{\"value\":\"The plaque reads: \\\"381 Mayfair Street\\\"\"}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"go west\"}]},\"or\":[{\"eq\":[{\"value\":\"#command\"},{\"value\":\"go east\"}]},{\"eq\":[{\"value\":\"#command\"},{\"value\":\"use _left_hand_gate\"}]},{\"eq\":[{\"value\":\"#command\"},{\"value\":\"use _right_hand_gate\"}]},{\"eq\":[{\"value\":\"#command\"},{\"value\":\"examine _left_hand_gate\"}]},{\"eq\":[{\"value\":\"#command\"},{\"value\":\"examine _right_hand_gate\"}]}],\"then\":{\"say\":[{\"value\":\"The gate is locked.\"}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"go north\"}]},\"then\":{\"travel\":{\"value\":\"_street_2\"}}}]},\"_street_2\":{\"description\":{\"value\":\"{Further Down A Windy Street|_street_2}\"},\"do\":[{\"if\":{\"neq\":[{\"value\":\"#command\"},{\"value\":\"#enter\"}]},\"then\":{\"do\":{\"function\":{\"value\":\"_street_check_dead\"}}}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"look around\"}]},\"or\":[{\"eq\":[{\"value\":\"#command\"},{\"value\":\"#enter\"}]}],\"then\":{\"say\":[{\"say\":[{\"value\":\"Two more houses loom out of the darkness of the lonely street.<p>\"}]},{\"say\":[{\"value\":\"You see {!!an address plaque|_right_hand_plaque} by {!!a gate|_right_hand_gate} to the {!!east|go east}.<p>\"}]},{\"say\":[{\"value\":\"And {!!another plaque|_left_hand_plaque} near {!!the gate|_left_hand_gate} to the {!!west|go west}.<p>\"}]},{\"say\":[{\"value\":\"The street continues {!!north|go north}.\"}]}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"examine _left_hand_plaque\"}]},\"then\":{\"say\":[{\"value\":\"The plaque reads: \\\"382 Mayfair Street\\\"\"}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"examine _right_hand_plaque\"}]},\"then\":{\"say\":[{\"value\":\"The plaque reads: \\\"383 Mayfair Street\\\"\"}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"go west\"}]},\"or\":[{\"eq\":[{\"value\":\"#command\"},{\"value\":\"go east\"}]},{\"eq\":[{\"value\":\"#command\"},{\"value\":\"use _left_hand_gate\"}]},{\"eq\":[{\"value\":\"#command\"},{\"value\":\"use _right_hand_gate\"}]},{\"eq\":[{\"value\":\"#command\"},{\"value\":\"examine _left_hand_gate\"}]},{\"eq\":[{\"value\":\"#command\"},{\"value\":\"examine _right_hand_gate\"}]}],\"then\":{\"say\":[{\"value\":\"The gate is locked.\"}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"go north\"}]},\"then\":{\"travel\":{\"value\":\"_street_3\"}}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"go south\"}]},\"then\":{\"travel\":{\"value\":\"_street\"}}}]},\"_street_3\":{\"description\":{\"value\":\"{The End Of A Windy Street|_street_3}\"},\"do\":[{\"if\":{\"neq\":[{\"value\":\"#command\"},{\"value\":\"#enter\"}]},\"then\":{\"do\":{\"function\":{\"value\":\"_street_check_dead\"}}}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"look around\"}]},\"or\":[{\"eq\":[{\"value\":\"#command\"},{\"value\":\"#enter\"}]}],\"then\":{\"say\":[{\"say\":[{\"value\":\"The street ends here.<p>\"}]},{\"say\":[{\"value\":\"{!!A golden plaque|_right_hand_plaque} hangs near {!!the gate|_right_hand_gate} to the {!!east|go east}.<p>\"}]},{\"say\":[{\"value\":\"{!!Another plaque|_left_hand_plaque} hangs near {!!the gate|_left_hand_gate} to the {!!west|go west}.<p>\"}]}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"examine _left_hand_plaque\"}]},\"then\":{\"say\":[{\"value\":\"The plaque reads: \\\"384 Mayfair Street\\\"\"}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"examine _right_hand_plaque\"}]},\"then\":{\"say\":[{\"value\":\"The plaque reads: \\\"385 Mayfair Street\\\"\"}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"go east\"}]},\"or\":[{\"eq\":[{\"value\":\"#command\"},{\"value\":\"use _right_hand_gate\"}]}],\"then\":{\"travel\":{\"interrupt\":true,\"value\":\"_street_sinclair_front_lawn\"}}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"go west\"}]},\"or\":[{\"eq\":[{\"value\":\"#command\"},{\"value\":\"use _left_hand_gate\"}]},{\"eq\":[{\"value\":\"#command\"},{\"value\":\"examine _left_hand_gate\"}]}],\"then\":{\"say\":[{\"value\":\"The gate is locked.\"}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"go south\"}]},\"then\":{\"travel\":{\"value\":\"_street_2\"}}}]},\"_street_sinclair_front_lawn\":{\"description\":{\"value\":\"{Front Garden|_street_sinclair_front_lawn}\"},\"do\":[{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"#enter\"}]},\"or\":[{\"eq\":[{\"value\":\"#command\"},{\"value\":\"look around\"}]}],\"then\":{\"do\":[{\"if\":{\"eq\":[{\"variable\":\"_street_entered_lawn\"},{\"value\":\"false\"}]},\"then\":{\"do\":[{\"set\":[{\"value\":\"_street_entered_lawn\"},{\"value\":\"true\"}]},{\"clear\":true},{\"say\":[{\"value\":\"<p>You push open the gate and enter Dr. Sinclair's front garden.<p>\"}]}]}},{\"if\":{\"eq\":[{\"variable\":\"_street_entered_lawn\"},{\"value\":\"true\"}]},\"then\":{\"say\":[{\"value\":\"A gravel path leads from the {!!garden gate|_street_garden_gate} to the {!!west|go west} straight to {!!the front door|_street_front_door} of Dr. Sinclair's house to the {!!east|go east}.\"}]}}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"examine _street_front_door\"}]},\"then\":{\"say\":[{\"value\":\"The door is slightly ajar.\"}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"examine _street_garden_gate\"}]},\"then\":{\"say\":[{\"value\":\"You've shut the gate securely behind you. But how could any mere physical barrier hold back that Horror?\"}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"go west\"}]},\"then\":{\"say\":[{\"value\":\"You can sense It's presence just beyond the gate. Terror freezes your blood as you attempt to move toward it. You don't have the strength.\"}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"use _street_front_door\"}]},\"or\":[{\"eq\":[{\"value\":\"#command\"},{\"value\":\"go east\"}]}],\"then\":{\"travel\":{\"value\":\"_house_front_hall\"}}}]},\"_street_death\":{\"description\":{\"value\":\"You Have Died\"},\"do\":[{\"say\":[{\"value\":\"<p>Too long in the open, and without Dr. Sinclar's aid, the horrible shadow has consumed you.<p>\"}]},{\"say\":[{\"value\":\"(Refresh the page to play again)\"}]}]},\"_house_front_hall\":{\"description\":{\"value\":\"{Front Hall|_house_front_hall}\"},\"do\":[{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"#enter\"}]},\"or\":[{\"eq\":[{\"value\":\"#command\"},{\"value\":\"look around\"}]}],\"then\":{\"say\":[{\"if\":{\"nin\":[{\"value\":\"_hall_note\"},{\"value\":\"#player\"}]},\"then\":{\"say\":[{\"value\":\"A {!!hastily scrawled note|_hall_note} sits on a small table in the hall.\"}]}},{\"say\":[{\"value\":\"<p>A dark staircase leads {!!up to the second floor|go up}.<p>\"}]},{\"say\":[{\"value\":\"<p>At the {!!east|go east} end of the hall is a door.<p>\"}]},{\"say\":[{\"value\":\"<p>The front door is to the {!!west|go west}.<p>\"}]}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"go west\"}]},\"then\":{\"travel\":{\"value\":\"_street_sinclair_front_lawn\"}}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"go up\"}]},\"then\":{\"travel\":{\"value\":\"_house_upstairs\"}}}]},\"_house_upstairs\":{\"description\":{\"value\":\"{Second Floor Hall|_house_upstairs}\"},\"do\":[{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"#enter\"}]},\"or\":[{\"eq\":[{\"value\":\"#command\"},{\"value\":\"look around\"}]}],\"then\":{\"say\":[{\"say\":[{\"value\":\"A {massive mural|_mural} covers the wall at the top of stairs: {The night sky|_mural_sky}, filled with strange constellations, stretches above a {tumultuous sea|_mural_sea}.\"}]},{\"say\":[{\"value\":\"On the right, a {flaming red sun|_mural_sun} rises out of the waves. On the left, a {pale yellow moon|_mural_moon} sinks behind the haunting silhouette of an island.\"}]},{\"say\":[{\"value\":\"<p>There are doors to the {!!north|go north} and {!!south|go south}.<p>\"}]}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"go north\"}]},\"then\":{\"do\":[{\"if\":{\"eq\":[{\"variable\":\"_mural_puzzle_solved\"},{\"value\":\"false\"}]},\"then\":{\"say\":[{\"value\":\"The door has no knob, and it won't budge.\"}]}},{\"if\":{\"eq\":[{\"variable\":\"_mural_puzzle_solved\"},{\"value\":\"true\"}]},\"then\":{\"travel\":{\"value\":\"_house_laboratory\"}}}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"go south\"}]},\"then\":{\"say\":[{\"value\":\"The door is locked.\"}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"examine _mural\"}]},\"then\":{\"say\":[{\"value\":\"Upon closer inspection, you can see that the mural is made up of several large pieces, some of which are slightly raised.<p>\"}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"use _mural_sky\"}]},\"then\":{\"do\":[{\"say\":[{\"value\":\"You push against the starry sky and it gives slightly.\"}]},{\"if\":{\"eq\":[{\"variable\":\"_mural_sequence\"},{\"value\":\"0\"}]},\"then\":{\"do\":[{\"set\":[{\"value\":\"_mural_sequence\"},{\"value\":\"1\"}]},{\"say\":[{\"value\":\"You hear a faint click.\"}]}]},\"else\":{\"do\":[{\"set\":[{\"value\":\"_mural_sequence\"},{\"value\":\"0\"}]},{\"say\":[{\"value\":\"You hear a distant clang.\"}]}]}}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"use _mural_sea\"}]},\"then\":{\"do\":[{\"say\":[{\"value\":\"You push against the raging waves and they gives slightly.\"}]},{\"if\":{\"eq\":[{\"variable\":\"_mural_sequence\"},{\"value\":\"1\"}]},\"then\":{\"do\":[{\"set\":[{\"value\":\"_mural_sequence\"},{\"value\":\"2\"}]},{\"say\":[{\"value\":\"You hear a faint click.\"}]}]},\"else\":{\"do\":[{\"set\":[{\"value\":\"_mural_sequence\"},{\"value\":\"0\"}]},{\"say\":[{\"value\":\"You hear a distant clang.\"}]}]}}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"use _mural_sun\"}]},\"then\":{\"do\":[{\"say\":[{\"value\":\"You push against the burning sun and it gives slightly.\"}]},{\"if\":{\"eq\":[{\"variable\":\"_mural_sequence\"},{\"value\":\"2\"}]},\"then\":{\"do\":[{\"set\":[{\"value\":\"_mural_sequence\"},{\"value\":\"3\"}]},{\"say\":[{\"value\":\"You hear a faint click.\"}]}]},\"else\":{\"do\":[{\"set\":[{\"value\":\"_mural_sequence\"},{\"value\":\"0\"}]},{\"say\":[{\"value\":\"You hear a distant clang.\"}]}]}}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"use _mural_moon\"}]},\"then\":{\"do\":[{\"say\":[{\"value\":\"You push against the pale moon and it gives slightly.\"}]},{\"if\":{\"eq\":[{\"variable\":\"_mural_sequence\"},{\"value\":\"3\"}]},\"then\":{\"do\":[{\"set\":[{\"value\":\"_mural_sequence\"},{\"value\":\"4\"}]},{\"set\":[{\"value\":\"_mural_puzzle_solved\"},{\"value\":\"true\"}]},{\"say\":[{\"value\":\"After a series of tapping sounds, the door to the {!!north|go north} swings open.\"}]}]},\"else\":{\"do\":[{\"set\":[{\"value\":\"_mural_sequence\"},{\"value\":\"0\"}]},{\"say\":[{\"value\":\"You hear a distant clang.\"}]}]}}]}}]},\"_house_laboratory\":{\"description\":{\"value\":\"To Be Continued...\"},\"do\":[{\"say\":[{\"value\":\"You enter the shadowy laboratory of Dr. Sinclair...\"}]}]}},\"things\":{\"#player\":{\"location\":\"_intro\"},\"_sinclar_letter\":{\"location\":\"#player\",\"description\":\"{!!a letter from Dr. Walter Sinclar|_sinclar_letter}\",\"do\":[{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"examine _sinclar_letter\"}]},\"then\":{\"if\":{\"in\":[{\"value\":\"_sinclar_letter\"},{\"value\":\"#player\"}]},\"then\":{\"do\":[{\"say\":[{\"value\":\"\\\"Dear Mr. Smith<p>\"}]},{\"say\":[{\"value\":\"I have learned of your plight. Make no mistake, you are in grave danger.\"}]},{\"say\":[{\"value\":\"However, I believe I can help you. Come to my home on Mayfair Street at once, number 385.<p>\"}]},{\"say\":[{\"value\":\"Do not delay.\\\"\"}]}]}}}]},\"_hall_note\":{\"location\":\"_house_front_hall\",\"description\":\"{!!a hastily scrawled note|_hall_note}\",\"do\":[{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"examine _hall_note\"}]},\"then\":{\"say\":[{\"say\":[{\"value\":\"\\\"Mr. Smith,<p>\"}]},{\"say\":[{\"value\":\"I could wait no longer for you to arrive. Somehow the Presence has learned of my letter to you and I cannot risk any more delay.\"}]},{\"say\":[{\"value\":\"But rest assured, though the heavens may fall into the depths of the abyss and the rising sun burn the sickly moon, all is not lost.<p>\"}]},{\"say\":[{\"value\":\"Follow me.\\\"\"}]}]}},{\"if\":{\"eq\":[{\"value\":\"#command\"},{\"value\":\"use _hall_note\"}]},\"then\":{\"if\":{\"nin\":[{\"value\":\"_hall_note\"},{\"value\":\"#player\"}]},\"then\":{\"do\":[{\"say\":[{\"value\":\"You take the note.\"}]},{\"move\":[{\"value\":\"_hall_note\"},{\"value\":\"#player\"}]}]}}}]}},\"variables\":{\"_street_num_turns\":{\"value\":\"0\"},\"_street_entered_lawn\":{\"value\":\"false\"},\"_mural_puzzle_solved\":{\"value\":\"false\"},\"_mural_sequence\":{\"value\":\"0\"},\"#turn\":{\"value\":\"1\"}},\"functions\":{\"_street_check_dead\":[{\"set\":[{\"value\":\"_street_num_turns\"},{\"modifier\":{\"operation\":\"add\",\"operand\":{\"value\":\"1\"}},\"variable\":\"_street_num_turns\"}]},{\"if\":{\"eq\":[{\"variable\":\"_street_num_turns\"},{\"value\":\"3\"}]},\"then\":{\"say\":[{\"value\":\"<p>The wind is beginning to howl.<p>\"}]}},{\"if\":{\"eq\":[{\"variable\":\"_street_num_turns\"},{\"value\":\"6\"}]},\"then\":{\"say\":[{\"value\":\"<p>You sense It drawing near.<p>\"}]}},{\"if\":{\"eq\":[{\"variable\":\"_street_num_turns\"},{\"value\":\"9\"}]},\"then\":{\"say\":[{\"value\":\"<p>\\\"God save me... It's here...\\\"<p>\"}]}},{\"if\":{\"eq\":[{\"variable\":\"_street_num_turns\"},{\"value\":\"10\"}]},\"then\":{\"do\":[{\"clear\":true},{\"travel\":{\"interrupt\":true,\"value\":\"_street_death\"}}]}}]},\"settings\":{\"keywords\":[{\"keyword\":\"use\"},{\"keyword\":\"examine\"},{\"keyword\":\"look around\"},{\"keyword\":\"{inventory|check inventory}\"},{\"keyword\":\"{north|go north}\"},{\"keyword\":\"{south|go south}\"},{\"keyword\":\"{east|go east}\"},{\"keyword\":\"{west|go west}\"}]}}";


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