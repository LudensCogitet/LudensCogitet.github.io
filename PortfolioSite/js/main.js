
function zoomOut(e){
	e.preventDefault();
	$(this).off('click');
	$('#navSpace').fadeIn(500);
	$(this).fadeTo(500,0,function(){
		$(this).remove();
		$('body').css('overflow-y','');
	});
}

function zoomIn(e){
	e.preventDefault();
	var zoomed = $("<img src='"+$(this).attr('src')+"'>");
	zoomed.load(function(){
		zoomed.css({opacity: 0,
								position: 'absolute',
								'height': '100vh',
								'z-index': 10});
		$('body').css('overflow-y','hidden');
		zoomed.appendTo($('body'));
	
		if(zoomed.width() < $(window).width()){
			zoomed.css({'left': '50%',
									'margin-left': -zoomed.width()/2});
		}

		$('#navSpace').fadeOut(500);
		zoomed.fadeTo(500,1,function(){
			console.log("HI");
			zoomed.click(zoomOut);
		});
	});
}

function setViewScreenTop(element){
	if(element.height() > $(window).height()){
		return	{top: 0};
	}
	else{
		return {top: $(window).height()/2 -element.height()/2};
	}
}

$(document).ready(function(){
	var currentScreen = $("#1");
	var background = new BackgroundAnimation(['#00ace6','#99e6ff'],500,50);
	background.setup('fromBottom');
	
 setTimeout(function(){
	 	background.play(function(){
		$('.firstScreen').css('display','block');
		$('.firstScreen').css(setViewScreenTop($('.firstScreen')));
		background.play(function(){
			$('.firstScreen').css('z-index',0);
			background.play(function(){$('#navSpace').fadeIn(800);},'in');
		},'outUp');
		//$('.firstScreen').animate(setViewScreenTop($('.firstScreen')),500);
	},'in');
	
	/*$('.firstScreen').css(setViewScreenTop($('.firstScreen')));*/
 },200);
	
	function moveToScreen(targets){
		var target = $('#'+targets[0]);
		var newTopVal = $(window).height()+1;
		if(targets[0] > currentScreen.attr('id')){
			console.log("BOOP");
			target.css('top', newTopVal);
			newTopVal = -newTopVal -currentScreen.height();
		}
		
		$('#navMenu .active').removeClass('active');
		$('#navMenu li[data-target='+targets[0]+']').addClass('active');
		
		$(window).scrollTop(0);
		$(document).scrollTop(0);
		console.log('newTopVal',newTopVal);
		console.log('target',targets[0]);
		$('body').css('overflow', 'hidden');
		target.css('display','block');
		console.log($(window).scrollTop());
			currentScreen.animate({top:newTopVal},500,"swing",function(){
				console.log('top',currentScreen.css('top'));
				currentScreen.css('display','none');
				target.animate(setViewScreenTop(target),500,"swing",function(){
					currentScreen = target;
					$('body').css('overflow','auto');
					if(targets.length > 1){
						targets.shift();
						moveToScreen(targets);
					}
				});
			});
	}
	
	$('.button').click(function(e){
		e.preventDefault();
		moveToScreen([$(this).data('target')]);
		
	});
	
	$('#navMenu li').click(function(e){
		var $this = $(this);
		e.preventDefault();
		$this.addClass('active');
		moveToScreen([$this.data('target')]);
	});
	
	$('.pic').click(zoomIn);
	
	$('#navSpace').click(function(){
		var $this = $(this);
		if($this.hasClass('navClosed')){
			$this.removeClass('navClosed');
			$('#navIcon *').fadeOut(500,function(){
					$('#navIcon').slideUp(500,function(){
					$('#navIcon').hide();
					$('#navMenu').slideDown(500);
				});
			});
		}
	});
	
	$(window).resize(function(){
		currentScreen.css(setViewScreenTop(currentScreen));
		currentScreen.css('display','block');
		currentScreen.css(setViewScreenTop($('.firstScreen')));
		currentScreen.css('z-index',0);
		$('#navSpace').show();
	});
});