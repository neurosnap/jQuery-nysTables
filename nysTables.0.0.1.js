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
          "table": table
        },
        "success": function(data, text_status, jqr) {

          //make primary key easier to get by removing array
          //data.PK = data.PK[0].PK_column;

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

  function modalLaunch(scope, table, pk) {

    $.ajax({
      "url": scope.settings.url,
      "type": "POST",
      "dataType": "json",
      "data": {
        "action": "get_record",
        "table": table,
        "pk": pk
      },
      "success": function(data, tet_status, jqr) {

        $("#nys-boxes #dialog")
          .fadeIn(600)
          .html(modalDisplay(scope, data));

      }
    });

  };

  function modalDisplay(scope, data) {
    console.log(data);
    return "SUP";
  };

  function jsonToDataTable(scope, data) {

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

          if (prop == data.PK) {
            options.sClass = "nys-pk";
          }

          options.sTitle = toTitleCase(prop);
          ret.columns.push(options);

        }

        first = false;

      }

      for (var prop in obj) {

        if (obj[prop] != null)
          row_agg = row_agg + obj[prop].toString().replace(/,/g, '') + ',';
        else
          row_agg += ",";
        
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

/*this.settings.getName = function() {

  that.each(function() {
    console.log(that.settings.name);
  });

};*/