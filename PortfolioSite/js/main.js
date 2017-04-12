
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
	
	for(let i = 0; i < elements.length; i++){
		waypoints.push(new Waypoint({
																element: elements[i],
																handler: function(){
																	console.log(this.element);
																	$(this.element).addClass("animated slideInLeft");
																},
																offset: '50%'}));
	}
	
	$('.pic').click(zoomIn);
	
	$('a[href^="#"]').on('click',function (e) {
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