nysTables
=========

Front-end user interface to add, edit, and remove columns, data from a relational database.

[Demo](http://nysus.net/erb/nysTables/nysTables.html)

Set-up
---------

Dependencies:

  * jQuery (http://jquery.com/)
  * Datatables (https://datatables.net/)

./db.php
Settings for database connection, links with built-in
basic ORM (./orm.php)

```
<?php

$db = new stdClass();

//Server address
$db->server = "localhost";
//Database name
$db->dba = "";
$db->user = "";
$db->pass = "";
//e.g. sqlsrv, mssql, or mysql
$db->driver = "sqlsrv";

?>
```

How-To -- Basic Configuration
---------

nysTables gets initialized on a table tag in HTML.
The most basic configuration requires "config" key in the object settings or "nys-config" data attribute in the table tag, 
linking with a configuration file on the server that returns an object with the name of the table "table" and the columns minimum
"columns" to show in the table.

The nysTables object returns the settings object for nysTables.

HTML

```
<head>
  <link href="assets/css/jquery.dataTables.css" rel="stylesheet" type="text/css" />
  <link href="assets/css/nysTables.css" rel="stylesheet" type="text/css" />
  
  <script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>
  <script type="text/javascript" src="assets/js/jquery.dataTables.min.js"></script>
  <script type="text/javascript" src="nysTables.0.0.1.js"></script>

  <script>
    $(function() {
      $("#nysID").nysTables({ 
        "url": "config.php",
        "config": "users_config" 
      });
    });
  </script>

</head>
<body>
  <table id="nysID"></table>
</body>
```

./config.php
Configure the table name and columns you want to view here that 
are checked in SQL.

```
<?php

require_once("./nysTablesAPI.php");

function users_config() {

    $config = new stdClass();

    $config->table = "users";
    //not necessary but filters what is shown
    $config->columns = array("ID", "name", "email", "info");

    return $config;

}

?>
```

Options
---------

#### url as String
URL pointing to server reference for AJAX call

#### new_records as Boolean
Determines whether or not new records can be added to the table

#### allow_delete as Boolean
If all foreign key relationships have a non-"NO ACTION" delete rule, then this flag will determine if a record
can be deleted

#### datatable as Object
DataTable options object that can customize datatable that will be displayed

#### columns as Array of Objects
  *  name (String) -- Name of the column that nysTables searches to apply certain properties
  *  classes (String or Array of Strings) -- Will attempt to add CSS classes to column of data, useful for event handling. String is looking for space delimited, e.g. { classes: "class one two three" }.
  *  inputs (Object) -- Same as global inputs only targets specific column

#### inputs as Object
This object gets checked against the column's data type and returns a string containing HTML 
content for the input box or whatever content you want instead.  Defaults:
  *  int -- text box
  *  float -- text box
  *  varchar -- text box
  *  text -- textarea
  *  bit - radio buttons
  *  date - text box
  *  datetime - text box
  *  fk (function foreign_key_info Obj) -- Used as the default foreign key select dropdown as a function and returns the HTML for the FK column

Callbacks
---------

Methods (Public)
---------

Methods (Private)
---------

#### init (scope)
Initializes nysTables and datatables after all the settings and options have been set up.

#### listen_global (scope)
Initializes global event handlers across all nysTables

#### listen (scope)
Initializes event handlers for each item within the scope

#### loadButtons (el, scope)
Injects buttons into DOM within dataTables_wrapper class.

#### editModalLaunch (scope, table, pk)
AJAX call to grab specific column data as well as key restraints, foreign key data and displays
popup modal

#### editModalDisplay (scope, data)
Injects record form data into popup modal with edit, delete options

#### showFKModal (scope, table, pk)
Displays modal for foreign key relationship data

#### setMaskDimensions ()
Sets the background mask dimensions to adjust for screen size changes

#### getInputColumn (scope, columns)
Returns string with input element for specified column and properties such as "required"

#### jsonToDataTable (scope, data)
Converts JSON formatted response data from the server and 
converts it into a DataTable formatted options object to be passed into ex: $("table").dataTable(jsonToDataTable(scope, data));

#### jsonToSelect (data)
Converts JSON formatted data into an HTML select dropdown formatter HTML string and returns it.

```
  data = [{
    "text": "Option 1",
    "value": 1
  }, {
    "text": "Option 2",
    "value": 2
  }];
```

#### isOdd (number)
Determines whether or not number is even or odd

#### capFirst (string)
Capitalizes first character in string

#### toTitleCase (string)
Replaces underscores with spaces and then capitalizes the first letter of each word

Credits 
---------

Created by Eric Bower