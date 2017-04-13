
function zoomOut(){
	$(this).off('click');
	$(this).removeClass("picZoom");
	$(this).click(zoomIn);
}

function zoomIn(){
	$(this).off('click');
	$(this).addClass("picZoom");
	$(this).click(zoomOut);
}

$(document).ready(function(){
	var waypoints = [];
	var elements = document.getElementsByClassName('subheading');
	var lastScroll = 0;
	var currentScreen = $("#1");
	
	$('.button').click(function(e){
		e.preventDefault();
		var target = $($(this).data('target'));
		var newTopVal = "5000px";
		if($(this).hasClass('nextButton'))
			newTopVal = "-5000px";
		
		currentScreen.animate({top:newTopVal},500,"swing",function(){
			target.animate({top: "25vh"},500,"swing");
			currentScreen=target;
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