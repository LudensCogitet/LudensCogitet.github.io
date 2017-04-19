
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
	var $this = $(this);
	e.preventDefault();
	var zoomed = $("<img src='"+$this.attr('src')+"'>");
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
		$this.fadeTo(500,0);
		zoomed.fadeTo(500,1,function(){
			zoomed.click(zoomOut);
			zoomed.click(function(){$this.fadeTo(500,1)});
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

function loadScreens(){
		$.ajax(
				 {method: "POST",
					url: "getScreens.php",
					error: function(){$('body').append($('<h1>Sorry about this, but something\'s gone wrong.</h1>'));},
					success: function(result){
						console.log(result);
						result = JSON.parse(result);
						console.log(result);
						
						$('#main.navMenu').append(result.menu);
						
						$('#main.navMenu').find('li.option').click(function(e){
							var $this = $(this);
							e.preventDefault();
							moveToScreen([$this.data('target')]);
							$this.siblings('.category').find('.submenu').slideUp(500);
						});
						
						$('#main.navMenu').find('li.category').click(function(e){
							var $this = $(this);
							e.preventDefault();
							var submenu = $this.children('.submenu');
							submenu.css({left: -submenu.width()});
							submenu.slideDown(500);
						});
						
						for(let i = 0; i < result.screens.length; i++){
							if(result.screens.length > 2 && i == 2 || i == result.screens.length-1){
								currentScreen = $('.firstScreen');
							}
							
							var newScreen = $(result.screens[i]);
							
							newScreen.find('.button').click(function(e){
								e.preventDefault();
								moveToScreen([$(this).data('target')]);
							});
							
							newScreen.find('.pic').click(zoomIn);
							
							$('body').append(newScreen);
							
						}
					}
				 });
}

var background = new BackgroundAnimation('#00ace6',500,50);
var currentScreen = null;

function moveToScreen(targets){
	if(targets[0] != currentScreen.attr('id')){
		var target = $('#'+targets[0]);
		console.dir(target);
		
		$('body').css('overflow', 'hidden');
		target.css('display','block');
			
		
		var newTopVal = $(window).height()+1;
		if(targets[0] > currentScreen.attr('id')){
			target.css('top', newTopVal);
			newTopVal = -newTopVal -currentScreen.height();
		}
		else{
			target.css('display','block');
			target.css('top', -newTopVal -currentScreen.height());
		}
		
		var activeMenuItem = $('.navMenu .active');
		var menuTarget = $('.navMenu li[data-target='+targets[0]+']');
		
		activeMenuItem.removeClass('active');
		
		menuTarget.addClass('active');
		menuTarget.parents('.submenu').slideDown(500);
		menuTarget.siblings('.category').find('.submenu').slideUp(500);
		
		$(window).scrollTop(0);
		//$(document).scrollTop(0);

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
}

function introAnim(){
	console.log(currentScreen);
	background.play(function(){
		if(currentScreen != null){
			currentScreen.css('display','block');
			currentScreen.css(setViewScreenTop($('.firstScreen')));
			background.play(function(){
				currentScreen.css('z-index',0);
				background.play(function(){
					$('#navSpace').fadeIn(800);
					background.fadeOut(background.remove);
				},'in');
			},'outUp');
		}
		else{
			background.play(function(){
				background.play(introAnim,'in');
			},'outUp');
		}
	},'in');
}

$(document).ready(function(){
	background.setup('fromBottom');
	setTimeout(function(){introAnim();},200);
	loadScreens();
	
	$('#navSpace').click(function(){
		var $this = $(this);
		if($this.hasClass('navClosed')){
			$this.removeClass('navClosed');
			$('#navIcon *').fadeOut(500,function(){
					$('#navIcon').slideUp(500,function(){
					$('#navIcon').hide();
					$('#main.navMenu').slideDown(500);
				});
			});
		}
	});
	
	$(window).resize(function(){
		currentScreen.css(setViewScreenTop(currentScreen));
		currentScreen.css('display','block');
		currentScreen.css(setViewScreenTop($('.firstScreen')));
		currentScreen.css('z-index',0);
		background.bail();
		$('#navSpace').show();
	});
});