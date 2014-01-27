nysTables
=========

Front-end user interface to add, edit, and remove columns, data from a relational database

Set-up
---------

Dependencies:

	* jQuery (http://jquery.com/)
	* Datatables (https://datatables.net/)

How-To
---------

nysTables gets initialized on a table tag.  
The most basic configuration requires "table" tag or "nys-table" data attribute in the table tag.
The nysTables object returns the settings object for nysTables.

HTML

	<body>

		<table class="nysClass" nys-table="users"></table>
		<table class="nysClass" nys-table="errors"></table>

		<table id="nysID"></table>

	</body>


Javascript

	$(function() {

		var nt = $(".nysClass").nysTables();

		var nti = $("#nysID").nysTables({ "table": "users" });

	});


db.php -- Settings for database connection

	<?php

		$db = new stdClass();

		//Server address
		$db->server = "";
		//Database name
		$db->dba = "";
		$db->user = "";
		$db->pass = "";
		//e.g. sqlsrv, mssql, or mysql
		$db->driver = "sqlsrv";

	?>


Options
---------

#### url as String
URL pointing to server reference for AJAX call

#### datatable as Object
DataTable options object that can customize datatable that will be displayed

Callbacks
---------

Methods (Public)
---------

Methods (Private)
---------

#### init (scope)
Initializes nysTables and datatables after all the settings and options have been set up.

#### jsonToDataTable (scope, data)
Converts JSON formatted response data from the server and 
converts it into a DataTable formatted options object to be passed into ex: $("table").dataTable(jsonToDataTable(scope, data));

#### jsonToSelect (data)
Converts JSON formatted data into an HTML select dropdown formatter HTML string and returns it.

	data = [{
		"text": "Option 1",
		"value": 1
	}, {
		"text": "Option 2",
		"value": 2
	}];

#### isOdd (number)
Determines whether or not number is even or odd

#### capFirst (string)
Capitalizes first character in string

#### toTitleCase (string)
Replaces underscores with spaces and then capitalizes the first letter of each word

Credits 
---------

Created by Eric Bower