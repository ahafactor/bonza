<?php
$servername = "localhost";
$username = "fabsi108_guest";
$password = "guest";
$dbname = "fabsi108_northwind";
$table = preg_replace('/%20/', ' ', $_GET["table"]);

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
} 

$sql = "SELECT * FROM `".$table."` LIMIT 10000";
$result = $conn->query($sql);

$xml = new SimpleXMLElement('<table/>');
Header('Content-type: text/xml');
$trow = $xml->addChild('tr');
$q = $conn->query('DESCRIBE `'.$table.'`');
$l = 0;
$fields = array();
while($row = $q->fetch_assoc()) {
	$trow->addChild('th', $row['Field']);
	$fields[$l] = $row['Field'];
	$l++;
}
$q->close();
// output data of each row
while($row = $result->fetch_row()) {
	$trow = $xml->addChild('tr');
	for($i = 0; $i < $l; $i++) {
		$tcell = $trow->addChild('td');
		$tcell->value = $row[$i];
	}
}
$result->close();
print($xml->asXML());    
$conn->close();
?>