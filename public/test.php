<?php
// Simple test to check if PHP is working
echo "PHP is working! Server time: " . date('Y-m-d H:i:s');
echo "<br>Document root: " . __DIR__;
echo "<br>Request URI: " . $_SERVER['REQUEST_URI'];
?>
