<?php
	if($_SERVER['REQUEST_METHOD'] == 'POST'){
		$screens = json_decode(file_get_contents('./screens.json'))->screens;
		
		$returnObj = ["menu" => "",
									"screens" => 				[]];
		
		$numScreens = count($screens);
		
		$d = -1;
		
		for($i = 0; $i < $numScreens; $i++){
			if(array_key_exists("START",$screens[$i])){
				$returnObj["menu"] .= "<li class='category'>".$screens[$i]->START."<span class='arrowRight'>&#128898;</span><span class='arrowDown' style='display: none;'>&#128899;</span><ul class='navMenu submenu'>";
			}
			else if(array_key_exists("END",$screens[$i])){
				$returnObj["menu"] .= "</ul></li>";
			}
			else{
				$d++;
				$entryText = $screens[$i]->text;
				$entryText = file_get_contents($entryText);
				$screens[$i]->text = $entryText;
				
				$newScreen;
				$newContent;
				$newHeading;
				$newText;
				$newPrevButton;
				$newNextButton;
				$newImage;
				$sourceCodeLink = "";
				$liveDemoLink = "";
				
				$close = '</div>';
				
				$classes = "screen";
				if($i == 0){
					$classes .= " firstScreen";
					$newPrevButton = "";
					$newNextButton = "<div class='button nextButton' data-target=".($d+1).">&#8681;</div>";
					$returnObj["menu"] .= "<li class='active option' data-target=".$d.">".$screens[$i]->name."</li>";
				}
				else if($i == $numScreens-1){
					$newPrevButton = "<div class='button prevButton' data-target=".($d-1).">&#8679;</div>";
					$newNextButton = "";
					$returnObj["menu"] .= "<li class='option' data-target=".$d.">".$screens[$i]->name."</li>";
				}
				else{
					$newPrevButton = "<div class='button prevButton' data-target=".($d-1).">&#8679;</div>";
					$newNextButton = "<div class='button nextButton' data-target=".($d+1).">&#8681;</div>";
					$returnObj["menu"] .= "<li class='option' data-target=".$d.">".$screens[$i]->name."</li>";
				}
				
				if(array_key_exists('sourceCodeLink',$screens[$i])){
					$sourceCodeLink = "<div class='infoLink'><a title='See the source on GitHub' target='_blank' href='".$screens[$i]->sourceCodeLink."'><div><img src='img/GitHub-Mark-64px.png'><div>GitHub</div></div></a></div>";
				}
				
				if(array_key_exists('liveDemoLink',$screens[$i])){
					$liveDemoLink = "<div class='infoLink'><a title='Check out the app in action' target='_blank' href='".$screens[$i]->liveDemoLink."'><div><img width=64 height=64 src='img/bigPlay.png'><div>Live Demo</div></div></a></div>";
				}
				
				$newScreen = "<div id=".$d." class='".$classes."'>".
												$newPrevButton.
												"<div class='content light'>".
													"<div class='heading'>".
														"<div style='display: inline-block; float: left; width: 60%; margin: 0;'>".
															"<h1>".$screens[$i]->heading."</h1>".
															"<h3 class='dark'>".$screens[$i]->subheading."</h3>".
														"</div>".
														"<div style='display: inline-block; float: right; width: 40%; margin: 0;'>".
															$sourceCodeLink.
															$liveDemoLink.
														"</div>".
													"</div>".	
													"<div class='text'>".
														"<span><img class='pic' src='".$screens[$i]->image."'></span>".
														$screens[$i]->text.
														"<div style='clear: both;'></div>".
													"</div>".
												"</div>".
												$newNextButton.
											"</div>";
				$returnObj["screens"][] = $newScreen;
			}
		}
		
		echo json_encode($returnObj,JSON_UNESCAPED_SLASHES);
	}
?>