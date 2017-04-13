
function zoomOut(e){
	e.preventDefault();
	$(this).off('click');
	$(this).fadeTo(500,0,function(){
		$(this).remove();
	});
}

function zoomIn(e){
	e.preventDefault();
	var zoomed = $("<img src='"+$(this).attr('src')+"'>");
	zoomed.css({opacity: 0,
							position: 'absolute',
							'height': '100vh',
							'z-index': 10});
	zoomed.appendTo($('body'));
	var xOffset = -zoomed.width()/2;
	zoomed.css({'left': '50%',
							'margin-left': xOffset});
	zoomed.fadeTo(500,1,function(){
		console.log("HI");
		zoomed.click(zoomOut);
	});
}

$(document).ready(function(){
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
			target.animate({top: "25vh"},500,"swing",function(){
				currentScreen=target;
				$('body').css('overflow','auto');
			});
			
		});
	});
	
	$('.pic').click(zoomIn);
	$('a[href^="#"]').click(function (e) {
	    e.preventDefault();

	    var target = this.hash;
	    var $target = $(target);

	    $('html, body').stop().animate({
	        'scrollTop': $target.offset().top
	    }, 2000, 'swing', function () {
	        window.location.hash = target;
	    });
	});
});