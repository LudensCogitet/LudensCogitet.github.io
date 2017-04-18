
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

function loadScreens(){
		$.ajax(
				 {method: "POST",
					url: "getScreens.php",
					error: function(){$('body').append($('<h1>Sorry about this, but something\'s gone wrong.</h1>'));},
					success: function(result){
							result = JSON.parse(result).screens;

							var newScreen;
							var newContent;
							var newHeading;
							var newText;
							var newPrevButton;
							var newNextButton;
						
						for(let i = 0; i < result.length; i++){
							if(result.length > 2 && i == 2 || i == result.length-1){
								currentScreen = $('.firstScreen');
							}
							
							var classes = "screen";
							if(i == 0){
								classes += " firstScreen";
								newPrevButton = null;
								newNextButton = $("<div class='button nextButton' data-target="+(i+1)+">&#8681;</div>");
							}
							else if(i == result.length-1){
								newPrevButton = $("<div class='button prevButton' data-target="+(i-1)+">&#8679;</div>");
								newNextButton = null;
							}
							else{
								newPrevButton = $("<div class='button prevButton' data-target="+(i-1)+">&#8679;</div>");
								newNextButton = $("<div class='button nextButton' data-target="+(i+1)+">&#8681;</div>");
							}
							
							
							newScreen = $("<div id="+i+" class='"+classes+"'>");
					
							classes = "content";
							
							if(i % 2 == 0)
								classes += " light";
							else
								classes += " dark";
							
							console.log("classes",classes);
							
							newContent = $("<div class='"+classes+"'>");
							
							if(i % 2 == 0)
								classes = "dark";
							else
								classes = "light";
							
							
							newHeading = $("<div class='heading'><h1>"+result[i].heading+"</h1><h3 class='"+classes+"'>"+result[i].subheading+"</h3></div>");
							
							newText = $("<div class='text'>"+result[i].text+"</div>");
							
							newText.prepend("<span><img class='pic' src='"+result[i].image+"'></span>");
							newText.append("<div style='clear:both;'>");
							
							newContent.append(newHeading);
							newContent.append(newText);
							
							newScreen.append(newPrevButton);
							newScreen.append(newContent);
							newScreen.append(newNextButton);
							console.dir(newScreen);
							
							$('body').append(newScreen);
						}
						
						$('.button').click(function(e){
							e.preventDefault();
							moveToScreen([$(this).data('target')]);
						});
						
						$('.pic').click(zoomIn);
					}
				 });
}

var background = new BackgroundAnimation('#00ace6',['#00ace6','#99e6ff'],500,50);
var currentScreen = null;

function moveToScreen(targets){
	var target = $('#'+targets[0]);
	console.dir(target);
	
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
	
	$('#navMenu li').click(function(e){
		var $this = $(this);
		e.preventDefault();
		$this.addClass('active');
		moveToScreen([$this.data('target')]);
	});
	
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
		background.bail();
		$('#navSpace').show();
	});
});