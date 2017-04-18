function BackgroundAnimation(bgColor = 'green', colors = ['green','blue'], setSpeed = 1000, setDelay = 100, lineWidth = 75){
	var $window = $(window);
	var lines = [];
	
	var resizeTimeout;
	var lineTimeouts = [];
	
	this.bail = function(){
		$('.line').stop();
		
		for(let i = 0; i < lineTimeouts.length; i++)
			clearTimeout(lineTimeouts[i]);
		
		lineTimeouts = [];
		
		$('html').css('background-color',bgColor);
		remove();
	}

	function setup(style = 'alternate'){
		lineTimeouts = [];
		
		if(lines.length > 0){
			for(let i = 0; i < lines.length; i++)
				lines[i].remove();
			lines = [];
		}
		
		for(let left = 0, d = 0; left < $window.width(); left += lineWidth, d++){
			var top;
			if(style == 'noAnim'){
				top = 0;
			}
			else if(style == 'fromTop'){
				top = -$window.height()-1;
			}
			else if(style == 'fromBottom'){
				top = $window.height()+1;
			}
			
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
	
  function play(callback = null, dir = 'in', speed = setSpeed, delay = setDelay){
		let newTop = 0;
		for(let i = 0; i < lines.length; i++){
			if(dir == 'outDown'){
				newTop = $window.height()+1;
			}
			else if (dir == 'outUp'){
				newTop = -$window.height()-1;
			}	
			
			if(i == lines.length -1 && callback != null){
				lineTimeouts.push(setTimeout(function(){lines[i].animate({top: newTop},speed,'swing',callback);},i*delay));
			}
			else{
				lineTimeouts.push(setTimeout(function(){lines[i].animate({top: newTop},speed);},i*delay));
			}
		}
	}
	this.play = play;
	
	this.fadeOut = function(callback, time = 500){
		$('html').css('background-color',bgColor);
		$('.backgroundLine').fadeOut(time,'swing',callback);
	}
	
	function remove(){
		$('.backgroundLine').remove();
	}
	
	this.remove = remove;
}