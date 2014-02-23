<?php
  
  header('Content-type: application/json');

  require("assets/php/orm.php");
  $orm = new ORM();

  if (array_key_exists("action", $_REQUEST)) {

    $action = $_REQUEST['action'];

  } else {

    die("No GET or POST 'action' key found, cannot proceed.");

  }

  if (is_callable($action)) {
    call_user_func($action, $orm, $_REQUEST);
  }

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
    $response->data = $orm->Qu($query, array(&$post['pk']), false);
    $response->data = $response->data[0];

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

    $response->FK = $orm->Qu($query, array(&$post["table"], &$post["table"]), false);

    if (count($response->FK) > 0) {

      for ($i = 0; $i < count($response->FK); $i++) {

        $response->FK[$i]->FK_PK = get_pk($orm, $response->FK[$i]->FK_table);

        $query = "SELECT * FROM " . $response->FK[$i]->FK_table;

        $response->FK[$i]->data = $orm->Qu($query, false, false);

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
    for ($j = 0; $j < count($sql_columns); $j++) {

      $found_column = false;
      $add_column = false;

      //loop js settings
      for ($i = 0; $i < count($js_columns); $i++) {

        //found a match
        if ($js_columns[$i]["column"] == $sql_columns[$j]["name"]) {

          $found_column = true;

          //check to make sure the sql column is nullable or has a default value
          if ($sql_columns[$j]["is_nullable"] === "YES" || !is_null($sql_columns[$j]["default"])) {
          
            //does js settings have visible property? 
            if (array_key_exists("visible", $js_columns[$i])) {

              if ($js_columns[$i]["visible"]) {

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

        //add to list of columns to grab data for
        array_push($list, $sql_columns[$j]["name"]);

      }

    }

    return implode(",", $list);

  }

?>