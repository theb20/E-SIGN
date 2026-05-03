<?php
// config.inc.php

$host = "localhost";
$user = "root";
$password = "root";
$dbname = "test";

// connexion PDO (optionnel mais propre)
try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8",
        $user,
        $password
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    die("Erreur connexion : " . $e->getMessage());
}
?>