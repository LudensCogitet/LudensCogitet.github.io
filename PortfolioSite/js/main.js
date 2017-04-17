
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
		return	{top: 0,'margin-top':''};
	}
	else{
		return {top: $(window).height()/2,
						'margin-top': -element.height()/2};
	}
}

$(document).ready(function(){
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
	
	var currentScreen = $("#1");
	
	function moveToScreen(targets){
		console.log("target", target, "currentScreen",currentScreen.attr('id'));
		var newTopVal = "5000px";
		if(targets[0] > currentScreen.attr('id'))
			newTopVal = "-5000px";
		
		$('#navMenu .active').removeClass('active');
		$('#navMenu li[data-target='+targets[0]+']').addClass('active');
		
		var target = $('#'+targets[0]);
		$('body').css('overflow', 'hidden');
		target.css('display','block');
		
		currentScreen.animate({top:newTopVal},500,"swing",function(){
			currentScreen.css('display','none');
			$(document).scrollTop(0);
			target.animate(setViewScreenTop(target),500,"swing",function(){
				currentScreen=target;
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
		$('.firstScreen').css('display','block');
		$('.firstScreen').css(setViewScreenTop($('.firstScreen')));
		$('.firstScreen').css('z-index',0);
		$('#navSpace').show();
	});
});