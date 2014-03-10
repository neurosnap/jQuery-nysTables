<?php

require_once("./nysTablesAPI.php");

function users_config($_REQUEST, $orm) {

    $config = new stdClass();

    $config->table = "users";
    $config->columns = array("ID", "name", "email", "info");

    return $config;

}

function error_log_config($_REQUEST, $orm) {

    $config = new stdClass();

    $config->table = "error_log";
    //$config->columns = array("ID", "name", "email", "info");

    return $config;

}

function reason_codes_config($_REQUEST, $orm) {

    $config = new stdClass();

    $config->table = "reason_codes";
    //$config->columns = array("ID", "name", "email", "info");

    return $config;

}

?>