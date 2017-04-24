
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
		return	{top: 30};
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
							e.stopPropagation();
							if($this.hasClass('active') == false){
								$('li.option.active').removeClass('active');
								$this.addClass('active');
								
								$this.parents(".category:not(.active)").addClass('active');
								
								$('li.category.active').not($this.parents()).removeClass('active');
								$('.arrowDown').hide();
								$('.arrowRight').show();
								
								$('#main.navMenu').find('.submenu').hide();
								
								moveToScreen([$this.data('target')]);
							}
						});
						
						$('#main.navMenu').find('li.category').click(function(e){
							e.preventDefault();
							e.stopPropagation();
							
							console.log("hi")
							
							var $this = $(this);
							var submenu = $this.children('.submenu');
							
							if(submenu.is(":hidden")){
								$this.children('.arrowRight').hide();
								$this.children('.arrowDown').show();
								submenu.show();
							}
							else{
								$this.children('.arrowDown').hide();
								$this.children('.arrowRight').show();
								submenu.hide();
							}
						});
						
						for(let i = 0; i < result.screens.length; i++){
							if(result.screens.length > 2 && i == 2 || i == result.screens.length-1){
								currentScreen = $('.firstScreen');
							}
							
							var newScreen = $(result.screens[i]);
							
							newScreen.find('.button').click(function(e){
								e.preventDefault();
								$('.navMenu li[data-target='+$(this).data('target')+']').click();
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
					$('#main.navMenu').fadeIn(800);
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
	
	$(window).resize(function(){
		currentScreen.css(setViewScreenTop(currentScreen));
		currentScreen.css('display','block');
		currentScreen.css(setViewScreenTop($('.firstScreen')));
		currentScreen.css('z-index',0);
		background.bail();
		$('#main.navMenu').show();
	});
});