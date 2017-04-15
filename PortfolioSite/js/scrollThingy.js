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