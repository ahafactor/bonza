<?php
$servername = "localhost";
$username = "fabsi108_guest";
$password = "guest";
$dbname = "fabsi108_northwind";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
} 

$sql = "SHOW TABLES";
$result = $conn->query($sql);

$xml = new SimpleXMLElement('<tables/>');
Header('Content-type: text/xml');
// output data of each row
while($row = $result->fetch_row()) {
	$trow = $xml->addChild('table', $row[0]);
}
$result->close();
print($xml->asXML());    
$conn->close();
?>