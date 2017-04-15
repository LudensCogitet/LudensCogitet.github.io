
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
			background.play(function(){$('#navbar').fadeIn(800);},'in');
		},'outUp');
		//$('.firstScreen').animate(setViewScreenTop($('.firstScreen')),500);
	},'in');
	
	/*$('.firstScreen').css(setViewScreenTop($('.firstScreen')));*/
 },200);
	
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
				$('body').css('overflow','auto');
			});
			
		});
	});
	
	$('.pic').click(zoomIn);
	$(window).resize(function(){currentScreen.css(setViewScreenTop(currentScreen));});
});