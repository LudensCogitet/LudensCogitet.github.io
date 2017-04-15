function BackgroundAnimation(setSpeed = 500, setDelay = 0, colors = ['green','blue'], lineWidth = 75, autoPlay = true){
	var $window = $(window);
	var lines = [];
	
	var resizeTimeout;
	var lineTimeouts = [];
	
	setup();
	if(autoPlay)
		play(setSpeed,setDelay);
	
	$window.resize(function(){
		$('.line').stop();
		
		for(let i = 0; i < lineTimeouts.length; i++)
			clearTimeout(lineTimeouts[i]);
		
		lineTimeouts = [];
		
		clearTimeout(resizeTimeout);
	
		resizeTimeout = setTimeout(function(){
			setup();
			play(setSpeed,setDelay);
		},100);
	});

	function setup(){
		lineTimeouts = [];
		if(lines.length > 0){
			for(let i = 0; i < lines.length; i++)
				lines[i].remove();
			lines = [];
		}
		
		for(let left = 0, d = 0; left < $window.width(); left += lineWidth, d++){
			var top;
			if(d % 2 == 0)
				top = $window.height()+1;
			else
				top = -$window.height()-1;
			
			var newDiv = $("<div class='backgroundLine'>");
			newDiv.hide();
			newDiv.appendTo($('body'));
			newDiv.css({top: top,
									left: left,
									width: lineWidth,
									height: $window.height(),
									'background-color': colors[d%2]});
			
			lines.push(newDiv);
			newDiv.show();
		}
	}
	this.setup = setup;
	
  function play(speed = setSpeed, delay = setDelay){
		for(let i = 0; i < lines.length; i++){
			lineTimeouts.push(setTimeout(function(){lines[i].animate({top: 0},speed);},i*delay));
		}
	}
	this.play = play;
}