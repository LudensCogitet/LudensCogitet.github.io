<?php
	if($_SERVER['REQUEST_METHOD'] == 'POST'){
		$screens = json_decode(file_get_contents('./screens.json'))->screens;
		
		$returnObj = ["menuCategories" => [],
									"screens" => 				[]];
		
		$numScreens = count($screens);
		
		for($i = 0; $i < $numScreens; $i++){
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
				$newNextButton = "<div class='button nextButton' data-target=".($i+1).">&#8681;</div>";
			}
			else if($i == $numScreens-1){
				$newPrevButton = "<div class='button prevButton' data-target=".($i-1).">&#8679;</div>";
				$newNextButton = "";
			}
			else{
				$newPrevButton = "<div class='button prevButton' data-target=".($i-1).">&#8679;</div>";
				$newNextButton = "<div class='button nextButton' data-target=".($i+1).">&#8681;</div>";
			}
			
			$newScreen = "<div id=".$i." class='".$classes."'>".
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
		
		echo json_encode($returnObj,JSON_UNESCAPED_SLASHES);
	}
?>