<?php

require_once("./nysTablesAPI.php");

function users_config() {

    $config = new stdClass();
    $config->table = "users";
    $config->columns = array("ID", "name", "email", "info");
    return $config;

}

function error_log_config() {

    $config = new stdClass();
    $config->table = "error_log";
    return $config;

}

function reason_codes_config() {

    $config = new stdClass();
    $config->table = "reason_codes";
    return $config;

}

?>