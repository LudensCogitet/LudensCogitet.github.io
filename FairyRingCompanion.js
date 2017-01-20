function randZeroToX(x){
  return Math.floor((Math.random() * x))
}

var cells = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37];

var choices = cells.slice();

function chooseCell(){
    var index = randZeroToX(choices.length);
    var tileRotation = randZeroToX(3) * 93;
    $("#board").css("background-position",(choices[index]*337)+"px 0px");
    $("#riverTile").css("background-position",tileRotation+"px 0px");
    choices.splice(index,1);
}

function reset(){
  $("#board").css("background-position: 0px 0px");
  choices = cells.slice();
  chooseCell();
}

$(document).ready(function(){
  $("#generate").click(chooseCell);
  $("#reset").click(reset);
  $(document).keypress(function(){
    if(event.keyCode == 13)
      chooseCell();
  });
  chooseCell();
});