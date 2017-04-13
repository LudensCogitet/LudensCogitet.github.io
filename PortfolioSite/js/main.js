
function zoomOut(e){
	e.preventDefault();
	$(this).off('click');
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

		zoomed.fadeTo(500,1,function(){
			console.log("HI");
			zoomed.click(zoomOut);
		});
	});
}

function setViewScreenTop(element){
	if(element.height() > $(window).height()){
		return	{top:'0vh'};
	}
	else{
		return {top:'50vh',
						'margin-top': -element.height()/2};
	}
}

$(document).ready(function(){
	$('.firstScreen').css('display','block');
	$('.firstScreen').css(setViewScreenTop($('.firstScreen')));
	
	var waypoints = [];
	var elements = document.getElementsByClassName('subheading');
	var lastScroll = 0;
	var currentScreen = $("#1");
	
	$('.button').click(function(e){
		e.preventDefault();
		var target = $($(this).data('target'));
		$('body').css('overflow', 'hidden');
		target.css('display','block');
		
		var newTopVal = "5000px";
		if($(this).hasClass('nextButton'))
			newTopVal = "-5000px";
		
		currentScreen.animate({top:newTopVal},500,"swing",function(){
			currentScreen.css('display','none');
			$(document).scrollTop(0);
			target.animate(setViewScreenTop(target),500,"swing",function(){
				currentScreen=target;
				console.log("scrollTop",$(document).scrollTop());
				console.log("scrollTop",$(document).scrollTop());
				$('body').css('overflow','auto');
			});
			
		});
	});
	
	$('.pic').click(zoomIn);
});