<?php

require_once("./nysTablesAPI.php");

function users_config($_REQUEST, $orm) {

    $config = new stdClass();

    $config->table = "users";
    //$config->columns = array("");

    return $config;

}

?>