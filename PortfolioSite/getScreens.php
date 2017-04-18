<?php
	if($_SERVER['REQUEST_METHOD'] == 'POST'){
		$jsonObj = json_decode(file_get_contents('./screens.json'));
		
		for($i = 0; $i < count($jsonObj->screens); $i++){
			$entryText = $jsonObj->screens[$i]->text;
			$entryText = file_get_contents($entryText);
			$jsonObj->screens[$i]->text = $entryText;
		}
		
		echo json_encode($jsonObj);
	}
?>