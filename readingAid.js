function Word(text,parent){
    var state = "span";
    
    var change = function(){
      
      if(state == "span"){
        let width = $(this).width() + 7;
        let newEl = $("<input class='word' type='text' value='"+text+"'>");
        $(this).replaceWith(newEl);
        newEl.width(width);
        newEl.click(change);
        newEl.keydown(function(event){if(event.keyCode == 13)$.proxy(change,this)();});
        newEl.focus();
        newEl.select();
        state = "input";
      }
      else if(state == "input"){
        text = $(this).val();
        let newEl = $("<span class='word'>"+text+"</span>");
        $(this).replaceWith(newEl);
        newEl.click(change);
      
        state = "span";
      }
    }
  
    this.getText = function(){
      return text;
    }
    
    this.getElement = function(){
      var returnEl = $("<span class='word'>"+text+"</span>");
      returnEl.click(change);
      return returnEl;
    }
  }

function Sentence(text){
  var words = text.split(" ");
  for(let i = 0; i < words.length; i++){
    words[i] = new Word(words[i]);
  }
  
  this.getElement = function(){
    var element = $("<div class='sentence'>");
    element.append("<span>");
  
    for(let i = 0; i < words.length; i++){
      element.append(words[i].getElement());
      element.append("<span class='space'> </span>");
    }
    
    return element;
  }
  
  this.getText = function(){
    var textArr = [];
    for(let i = 0; i < words.length; i++){
      textArr.push(words[i].getText());
    }
    
    return textArr.join(" ");
  }
}

function SentenceSet(texts){  
  function quiz(targetEl,randOrder){
    var index = Math.floor(Math.random() * randOrder.length);
    var displayDiv = $("<div>"+texts[randOrder[index]]+"</div>");
    displayDiv.hide();
    targetEl.append(displayDiv);
    displayDiv.fadeIn();
    let wrapper = $("<div style='display: inline-block;'>");
    
    for(let i = 0; i < randOrder.length; i++){
      let buttonText = "";
      switch(i){
        case 0:
          buttonText = "Top";
        break;
        case 1:
          buttonText = "Middle";
        break;
        case 2:
          buttonText = "Bottom";
        break;
        default:
          buttonText = (i+1)+"th";
      }
      var newButton = $("<div class='quizButton'>"+buttonText+"</div>");
      if(i == index)
        newButton.click(function(){$(this).html("Correct!");});
      else
        newButton.click(function(){$(this).html("Incorrect!");});
      
      wrapper.append(newButton); 
   }
    targetEl.append(wrapper);
  }
  
  this.play = function(targetEl,displayTime){
    var group = $("<div>");
    
    var indices = [];
    for(let i = 0; i < texts.length; i++){
      indices.push(i);
    }
    console.log(indices,indices.length);
    
    var randIndices = []
    while(indices.length > 0){
      console.log(indices.length);
      randIndices.push(indices.splice(Math.floor(Math.random()*indices.length),1));
    }
    console.log(randIndices);
    
    for(let i = 0; i < randIndices.length; i++){
      let newDiv = $("<div>"+texts[randIndices[i]]+"</div>");
      group.append(newDiv);
    }
    
    group.hide();
    targetEl.append(group);
    
    group.fadeIn(400,function(){
      group.fadeOut(displayTime*1000,function(){
        group.remove();
        quiz(targetEl,randIndices);
      });
    });
    return group;
  }
}

function SetGenerator(homeEl,setEditor,setsDisplay){
  var currentSet = null;
  var sets = [];
  var loadedSets = null;
	
  var textField = $("<input type='text'>");
  var newButton = $("<button>New</button>");
  var addButton = $("<button>Add</button>");
	
	if(!hasLocalStorage()){
    alert("Saving is unavailable. Please allow 3rd party cookies in your browser settings and refresh this page to allow saving.");
  }
  else{
		var saveCheckbox = $("<input type='checkbox' id='saveCheckbox'></input>");
		let saveGroup = $("<span id='saveSets'>cards saved</span>");
		saveCheckbox.click(function(){
			if(sets.length > 0)
				localStorage.setItem("savedSets",stringifySets());
			else{
				if(localStorage.getItem("savedSets") !== null)
					localStorage.removeItem("savedSets");
			}
		});
		saveGroup.append(saveCheckbox);
    $("html").prepend(saveGroup);
		
		window.onbeforeunload = function(){
    if(localStorage.getItem("savedSets") === null && sets.length !== 0 || loadedSets != JSON.stringify(sets) && saveCheckbox.prop("checked") === false)
			return "Are you sure? The current set of flash cards has changed since the last save.";
		}
  }
  
  var leftButton = $("<button class='leftButton' style='width: 25px;'>&#8592;</button>");
  leftButton.click(function(){
        let myBox = $(this).parent();
        let index = myBox.prevAll(".setBoxDisplay").length;
        if(index > 0){
					saveCheckbox.prop('checked',false);
          let oldLeft = myBox.prev(".setBoxDisplay");
          myBox.detach();
          oldLeft.before(myBox);
          
          temp = sets[index-1];
          sets[index-1] = sets[index];
          sets[index] = temp;
        }
      });
  
  var rightButton = $("<button class='rightButton' style='width: 25px;'>&#8594;</button>");
  rightButton.click(function(){
        let myBox = $(this).parent();
        let index = myBox.prevAll(".setBoxDisplay").length;
        let numNextBoxs = myBox.nextAll(".setBoxDisplay").length;
        if(numNextBoxs > 0){
					saveCheckbox.prop('checked',false);
          let oldRight = myBox.next(".setBoxDisplay");
          myBox.detach();
          oldRight.after(myBox);
          
          temp = sets[index];
          sets[index] = sets[index+1];
          sets[index+1] = temp;
        }
      });
  
  var deleteButton = $("<button class='deleteButton' style='width: 60px;'>Delete</button>");
  deleteButton.click(function(){
				saveCheckbox.prop('checked',false);
        let index = $(this).parent().prevAll(".setBoxDisplay").length;
        sets.splice(index,1);
        $(this).parent().remove();
      });
  
  newButton.click(function(){
    if(textField.val().length > 0){
      currentSet = [new Sentence(textField.val()),
                    new Sentence(textField.val()),
                    new Sentence(textField.val())];
    
     setEditor.empty();
    
     currentSet.forEach(function(el){
        setEditor.append(el.getElement());
     });
    }
  });
  
  addButton.click(function(){
		saveCheckbox.prop('checked',false);
    if(currentSet != null){
      addToDisplay(currentSet);
      
      setEditor.empty();
      sets.push(currentSet);
      currentSet = null;
    }
  });
  
  function addToDisplay(setToDisplay){
    let setBoxDisplay = $("<div class='setBoxDisplay'>");

      for(let i = 0; i < setToDisplay.length; i++){
        setBoxDisplay.append($("<div class='setBoxItem'>"+setToDisplay[i].getText()+"</div>"));
      }
      
      setBoxDisplay.append(leftButton.clone(true));
      setBoxDisplay.append(deleteButton.clone(true));
      setBoxDisplay.append(rightButton.clone(true));
      
      setsDisplay.append(setBoxDisplay);
  }
  
  homeEl.append(textField);
  homeEl.append(newButton);
  homeEl.append(addButton);
  
  this.getSets = function(){
    var arr = [];
    
    for(let i = 0; i < sets.length; i++){
      let textArr = [];
      for(let d = 0; d < sets[i].length; d++){
        textArr.push(sets[i][d].getText());
      }
      arr.push(new SentenceSet(textArr));
    }
    
    if(arr.length == 0)
      return null;
    else
      return arr;
  }

  this.clearSets = function(){
    sets = [];
  }
  
  function stringifySets(){
    
		if(sets.length == 0)
			return null;
		
		var stringify = [];
    
    for(let i = 0; i < sets.length; i++){
      var stringSet = [];
      for(let d = 0; d < sets[i].length; d++){
        stringSet.push(sets[i][d].getText());
      }
      stringify.push(stringSet);
    }
    return JSON.stringify(stringify);
  }
  
  this.loadStringifiedSets = function(textArray){
    loadedSets = textArray;
		textArray = JSON.parse(textArray);
		console.log(textArray);
    sets = [];
    for(let i = 0; i < textArray.length; i++){
      var newSet = [];
      for(let d = 0; d < textArray[i].length; d++){
        newSet.push(new Sentence(textArray[i][d]));
      }
      sets.push(newSet);
      addToDisplay(newSet);
    }
  }
}

function hasLocalStorage(){
  var test = "test";
  try{
    console.log(localStorage.getItem("savedSets"));
    localStorage.setItem(test,test);
    if(localStorage.getItem(test) == "test"){
			console.log(localStorage.getItem(test));
      localStorage.removeItem(test);
    }
    return true;
  }
  catch(e){
    console.log(e);
    return false;
  }
}

$(document).ready(function(){
  $("#again").hide();
  var stateOfPlay = 0;
  var generator = new SetGenerator($("#generatorHome"),$("#container"),$("#setsDisplay"));
  
  if(hasLocalStorage()){
    let loadedSets = localStorage.getItem("savedSets");
    
    if(loadedSets !== null){
      generator.loadStringifiedSets(loadedSets);
    }
  }
  
  var currentCard = 0;
  var cards = null;
  var displayTime = 0;
  var playReturn = null;
  
  $("#start").click(function(){
    if(stateOfPlay == 0){
      cards = generator.getSets();
      console.log(cards);
      if(cards != null){
        $("#generatorHome").hide();
        $("#container").empty();
        $("#start").text("Start");
        $("#timerBox").hide();
        $("#setsDisplayContainer").hide();
        stateOfPlay = 1;
      }
    }
    else if(stateOfPlay == 1){
      currentCard = 0;
      displayTime = $("#displayFor").val();
      playReturn = cards[currentCard].play($("#container"),displayTime);
      $("#next").show();
      $("#start").text("Reset");
      stateOfPlay = 2;
    }
    else if(stateOfPlay == 2){
      $("#container").empty();
      $("#generatorHome").show();
      $("#timerBox").show();
      $("#start").text("Play");
      $("#next").hide();
      $("#next").text("Next");
      
      if(playReturn != null){
        playReturn.stop();
        playReturn == null;
      }
      
      $("#setsDisplayContainer").show();
      stateOfPlay = 0;
    }
  });
  
  $("#next").click(function(){
		if(currentCard < cards.length){
      currentCard++;
      
      if(currentCard == cards.length -1){
        $(this).text("Restart");
      }
      
      if(currentCard == cards.length){
        currentCard = 0;
        $(this).text("Next");
      } 
      $("#container").empty();
      playReturn.stop();
      playReturn = cards[currentCard].play($("#container"),displayTime);
    }
  });
});