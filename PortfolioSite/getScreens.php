<?php
	if($_SERVER['REQUEST_METHOD'] == 'POST'){
		$screens = json_decode(file_get_contents('./screens.json'))->screens;
		
		$returnObj = ["menu" => "",
									"screens" => 				[]];
		
		$numScreens = count($screens);
		
		$d = -1;
		
		for($i = 0; $i < $numScreens; $i++){
			if(array_key_exists("START",$screens[$i])){
				$returnObj["menu"] .= "<li class='category'><span style='float:left'>&#10094;</span>".$screens[$i]->START."<ul class='navMenu submenu'>";
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
					$returnObj["menu"] .= "<li class='bottom option' data-target=".$d.">".$screens[$i]->name."</li>";
				}
				else{
					$newPrevButton = "<div class='button prevButton' data-target=".($d-1).">&#8679;</div>";
					$newNextButton = "<div class='button nextButton' data-target=".($d+1).">&#8681;</div>";
					$returnObj["menu"] .= "<li class='option' data-target=".$d.">".$screens[$i]->name."</li>";
				}
				
				$newScreen = "<div id=".$d." class='".$classes."'>".
												$newPrevButton.
												"<div class='content dark'>".
													"<div class='heading'>".
														"<h1>".$screens[$i]->heading."</h1>".
														"<h3 class='light'>".$screens[$i]->subheading."</h3>".
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