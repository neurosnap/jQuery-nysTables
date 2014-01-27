<?php
	
	header('Content-type: application/json');

	require("assets/php/orm.php");
	$orm = new ORM();

	$action = $_POST['action'];

	if (is_callable($action)) {
		call_user_func($action, $orm, $_POST);
	}

	function get_table($orm, $post) {
		
		$response = new stdClass();

		//get table data
		$query = "SELECT * FROM " . $post['table'];

		$response->data = $orm->Qu($query, false, false);

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

		$response->columns = $orm->Qu($query, array(&$post['table']), false);

		//get Primary Key column name
		$query = "SELECT 
								column_name as 'PK_column'
							FROM 
								INFORMATION_SCHEMA.KEY_COLUMN_USAGE
							WHERE 
								OBJECTPROPERTY(OBJECT_ID(constraint_name), 'IsPrimaryKey') = 1
								AND table_name = (?)";

		$response->PK = $orm->Qu($query, array(&$post['table']), false);

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

		$response->FK = $orm->Qu($query, array(&$post['table'], &$post['table']), false);

		echo json_encode($response);

	}

?>