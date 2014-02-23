/* =======================================================================
 * nysTables.js v0.0.1
 * https://github.com/neurosnap/nysTables
 * Dependencies:  jQuery, 
 *                DataTables
 * Optional:      Select2, 
 *                JqueryUI Datepicker
 * =======================================================================
 * Copyright 2013 Eric Bower
 *
 *  This file is part of nysTables.
 * 
 *  nysTables is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  nysTables is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with nysTables.  If not, see <http://www.gnu.org/licenses/>.
 *
 * ======================================================================= */

;(function($, window, document, undefined) {
  
  $.fn.nysTables = function(options) {

    var that = this;

    //default settings
    this.settings = {
      //jQuery Element
      "jquery": this,
      "url": "nysTablesAPI.php"
    };

    //combines settings and options "deeply"
    $.extend(true, this.settings, options);

    init(this);
    listen(this);

    /*
    //public function
    this.settings.getName = function() {

      that.each(function() {
        console.log("word");
      });

    };*/

    return this.settings;

  };

  //Initializes datatables and nysTables
  function init(scope) {

    //create modal dialog
    if ($("#nys-boxes").length == 0) {

      $("body").append('<div id="nys-boxes"><div id="dialog" class="window"></div><div id="nys-mask"></div></div>');

      //set mask to height and width of page
      var mask_height = $(document).height();
      var mask_width = $(window).width();

      $("#nys-mask").css({
        "height": mask_height,
        "width": mask_width
      });

    }

    scope.each(function() {

      var that = this;

      var table = ($(this).attr("nys-table") || scope.settings.table);

      $.ajax({
        "url": scope.settings.url,
        "type": "POST",
        "dataType": "json",
        "data": {
          "action": "get_table",
          "table": table,
          "columns": JSON.stringify(scope.settings.columns)
        },
        "success": function(data, text_status, jqr) {

          var json_to_dt = jsonToDataTable(scope, data);
          
          //defualt dt settings
          var dt_settings = {
            "bDestroy": true,
            "aaData": json_to_dt.rows,
            "aoColumns": json_to_dt.columns
          };

          //combine settings and options
          $.extend(true, dt_settings, scope.settings.datatable);

            //datatables callback to get row data after row has been created
          dt_settings.fnCreatedRow = function(nRow, aData, iDataIndex) {
            
            //add class to datatables
            $("td:eq(0)", nRow).html('<a href="#">Edit</a>');
            $("td:eq(0)", nRow).addClass("nys-manage");

          };

          //initialize datatables as well as combine options from nysTables object
          $(that).dataTable(dt_settings);

        }
      });

    });

  };

  //Master event handler function
  function listen(scope) {

    $(scope).on("click", ".nys-manage a", function(e) {

      e.preventDefault();

      var nRow = $(this).parent().parent();

      //transition effect   
      $('#nys-mask').fadeTo("slow", 0.6); 

      //get table name
      var table = nRow.parent().parent().attr("nys-table") || scope.settings.table;
      var pk = nRow.find(".nys-pk").text();

      //launch modal
      modalLaunch(scope, table, pk);

    });

    $("body").on("click", "#nys-mask", function(e) {

      e.preventDefault();

      $(this).hide();
      $(".window").hide();

    });

  };

  //Get data for modal edit popup modal
  function modalLaunch(scope, table, pk) {

    $.ajax({
      "url": scope.settings.url,
      "type": "POST",
      "dataType": "json",
      "data": {
        "action": "get_record",
        "table": table,
        "pk": pk,
        "columns": JSON.stringify(scope.settings.columns)
      },
      "success": function(data, tet_status, jqr) {

        $("#nys-boxes #dialog")
          .fadeIn(600)
          .html(modalDisplay(scope, data));

      }
    });

  };

  //Display modal edit popup
  function modalDisplay(scope, data) {
    
    var content = '';

    for (var i = 0; i < data.columns.length; i++) {

      for (column in data.values) {

        if (data.columns[i].name === column) {
          content += getInputColumn(scope, data.columns[i], data.values[column]) + ' <br />';
        }

      }

    }

    return content;

  };

  function getInputColumn(scope, column, value) {

    if (value === null)
      value = "";

    var title = toTitleCase(column.name) + ': ';

    var condition = {
      "int": '<input type="text" value="' + value + '" class="nys-input">',
      "float": '<input type="text" value="' + value + '" class="nys-input">',
      "varchar": '<input type="text" value="' + value + '" class="nys-input">',
      "text": '<textarea class="nys-input">' + value + '</textarea>',
      "bit": 'True <input type="radio" name="" value="1" class="nys-input" ' + ((value) ? "checked=checked" : "") + '> False <input type="radio" name="" value="0" class="nys-input" ' + ((!value) ? "checked=checked" : "") + '>',
      "date": '<input type="" value="' + value + '" class="nys-input">',
      "datetime": '<input type="" value="' + value + '" class="nys-input">'
    };

    if (condition.hasOwnProperty(column.data_type)) {
      return title + condition[column.data_type];
    } else {
      return '<strong style="color: tomato;">Error with column (' + column.name + ') setup</strong>';
    }

  };

  //data = array of objects that converts it into a dataTable object
  function jsonToDataTable(scope, data) {

    //"ret"urned object
    var ret = {
      "columns": [],
      "rows": []
    };
    
    var row_agg = '';
    var first = true;

    for (var i = 0; i < data.data.length; i++) {

      row_agg = 'Edit,';

      var obj = data.data[i];

      if (first) {

        //manage column
        ret.columns.push({ "sTitle": "Manage" });

        for (var prop in obj) {

          var options = {};

          //Does data contain primary key property?
          if (data.hasOwnProperty("PK")) {
            
            //found primary key? add a special class for it
            if (prop == data.PK) {
              options.sClass = "nys-pk";
            }

          }

          options.sTitle = toTitleCase(prop);

          ret.columns.push(options);

        }

        first = false;

      }

      for (var prop in obj) {

        if (obj[prop] != null) {
          row_agg = row_agg + obj[prop].toString().replace(/,/g, '') + ',';
        } else {
          row_agg += ",";
        }
        
      }

      row_agg = row_agg.slice(0, -1);
      ret.rows.push(row_agg.split(","));

    }

    return ret;

  };

  function jsonToSelect(data) {

    if (typeof data !== "undefined" && data.length > 0) {

      var content = '<option value=""> - Choose - </option>';

      for (var i = 0; i < data.length; i++) {
        content = content + '<option value="' + data[i].value + '">' + data[i].text + '</option>';
      }

      return content;

    }

  };

  function isOdd(num) {
    return num % 2;
  };

  function capFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  //replaces underscores with spaces and then capitalizes
  //the first letter of each word
  function toTitleCase(string) {

    return string.replace(/_/g, " ").replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });

  };

}(jQuery, window, document));