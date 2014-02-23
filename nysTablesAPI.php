<?php
  
  header('Content-type: application/json');

  if (!array_key_exists("action", $_REQUEST))
    die("No GET or POST 'action' key found, cannot proceed.");

  $action = $_REQUEST['action'];

  if (!is_callable($action))
    die("No GET or POST 'action' key matches a function in the API, cannot proceed.");

  require("assets/php/orm.php");
  $orm = new ORM();

  call_user_func($action, $orm, $_REQUEST);

  function get_table($orm, $post) {
    
    $response = new stdClass();

    //default
    $query = "SELECT * FROM " . $post["table"];

    //any columns that should not be grabbed?
    if (array_key_exists("columns", $post)) {

      $js_cols = json_decode($post["columns"], true);

      if (gettype($js_cols) === "array" 
          && count($js_cols) > 0) {

        $sql_columns = json_decode(json_encode(get_columns($orm, $post["table"])), true);

        $query = " SELECT " . get_column_list($sql_columns, $js_cols) . " FROM " . $post["table"];

      }

    }

    $response->data = $orm->Qu($query, false, false);

    $response->PK = get_pk($orm, $post["table"]);

    echo json_encode($response);

  }

  function get_record($orm, $post) {

    $response = new stdClass();

    $PK = get_pk($orm, $post["table"]);

    //default
    $query = "SELECT * FROM " . $post["table"] . " WHERE " . $PK . " = ?";

    //any columns that should not be grabbed?
    if (array_key_exists("columns", $post)) {

      $js_cols = json_decode($post["columns"], true);

      if (gettype($js_cols) === "array" 
          && count($js_cols) > 0) {

        $sql_columns = json_decode(json_encode(get_columns($orm, $post["table"])), true);

        $query = " SELECT " . get_column_list($sql_columns, $js_cols) . " FROM " . $post["table"] . " WHERE " . $PK . " = ?";

      }

    }

    //echo $query;
    $response->values = $orm->Qu($query, array(&$post['pk']), false);
    $response->values = $response->values[0];

    $response->columns = get_columns($orm, $post["table"]);

    //get Foreign Key data
    $query = "SELECT 
                FK_table = FK.TABLE_NAME,
                FK_column = CU.COLUMN_NAME,
                PK_table = PK.TABLE_NAME,
                PK_column = PT.COLUMN_NAME,
                constraint_name = C.CONSTRAINT_NAME,
                update_rule = C.UPDATE_RULE,
                delete_rule = C.DELETE_RULE
              FROM 
                INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS C
                INNER JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS FK ON C.CONSTRAINT_NAME = FK.CONSTRAINT_NAME
                INNER JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS PK ON C.UNIQUE_CONSTRAINT_NAME = PK.CONSTRAINT_NAME
                INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE CU ON C.CONSTRAINT_NAME = CU.CONSTRAINT_NAME
                INNER JOIN (
                  SELECT i1.TABLE_NAME, i2.COLUMN_NAME
                  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS i1
                  INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE i2 ON i1.CONSTRAINT_NAME = i2.CONSTRAINT_NAME
                  WHERE i1.CONSTRAINT_TYPE = 'PRIMARY KEY'
                ) PT ON PT.TABLE_NAME = PK.TABLE_NAME
              WHERE
                FK.TABLE_NAME = (?)
                OR PK.TABLE_NAME = (?)";

    $response->constraints = $orm->Qu($query, array(&$post["table"], &$post["table"]), false);

    if (count($response->constraints) > 0) {

      for ($i = 0; $i < count($response->constraints); $i++) {

        $response->constraints[$i]->FK_PK = get_pk($orm, $response->constraints[$i]->FK_table);

        $query = "SELECT * FROM " . $response->constraints[$i]->FK_table;
        $response->constraints[$i]->data = $orm->Qu($query, false, false);

      }
  
    }

    echo json_encode($response);

  }

  function get_pk($orm, $table) {

    //get Primary Key column name
    $query = "SELECT 
              column_name as 'PK_column'
            FROM 
              INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE 
              OBJECTPROPERTY(OBJECT_ID(constraint_name), 'IsPrimaryKey') = 1
              AND table_name = (?)";

    $PK = $orm->Qu($query, array(&$table), false);

    if (count($PK) > 0) {
      return $PK[0]->PK_column;
    } else {
      return false;
    }

  }

  function get_columns($orm, $table) {

    //get table column information
    $query = "SELECT 
                COLUMN_NAME as 'name', 
                DATA_TYPE as 'data_type',
                COLUMN_DEFAULT as 'default', 
                IS_NULLABLE as 'is_nullable'
              FROM 
                INFORMATION_SCHEMA.COLUMNS
              WHERE
                TABLE_NAME = (?)";

    $columns = $orm->Qu($query, array(&$table), false);

    if (count($columns) > 0) {
      return $columns;
    } else {
      return false;
    }

  }

  //string of comma delimited columns to grab from SQL table
  function get_column_list($sql_columns, $js_columns) {

    $list = array();

    //list sql columns for table
    foreach ($sql_columns as $sql_col) {

      $found_column = false;
      $add_column = false;

      //list js columns from nysTables settings
      foreach ($js_columns as $js_col) {

        //found a match
        if ($js_col["column"] == $sql_col["name"]) {

          $found_column = true;

          if ($sql_col["is_nullable"] === "YES" || !is_null($sql_col["default"])) {
          
            if (array_key_exists("visible", $js_col)) {

              if ($js_col["visible"]) {
                $add_column = true;
              }

            } else {
              $add_column = true;
            }

          } else {
            $add_column = true;
          }

        }

      }

      if (!$found_column) {
        $add_column = true;
      }

      //add column, duh!
      if ($add_column) {
        array_push($list, $sql_col["name"]);
      }

    }

    return implode(",", $list);

  }

?>