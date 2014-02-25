/* =======================================================================
 * nysTables.js v0.0.1
 * https://github.com/neurosnap/nysTables
 * ======================================================================= */

;(function($, window, document, undefined) {
  
  $.fn.nysTables = function(options) {

    var that = this;

    $(that).addClass("nys-table");

    //default settings
    this.settings = {
      "url": "nysTablesAPI.php"
    };

    //combines settings and options "deeply"
    $.extend(true, this.settings, options);

    //init(this);
    listen_global(this);

    this.each(function() {
      this.settings = that.settings;
      init(this);
    });

    return this.settings;

  };

  //Initializes datatables and nysTables
  function init(scope) {

    //create modal dialog
    if ($("#nys-boxes").length == 0) {
      $("body").append('<div id="nys-boxes"><div id="dialog" class="window"></div><div id="nys-mask"></div></div>');
    }

    var that = scope;

    var table = ($(that).attr("nys-table") || scope.settings.table);

    $.ajax({
      "url": scope.settings.url,
      "type": "POST",
      "dataType": "json",
      "data": {
        "action": "get_table",
        "table": table,
        "columns": JSON.stringify(scope.settings.columns)
      },
      "beforeSend": function() {
        $(that).html('<img src="./assets/img/loading.gif" class="nys-loading" />');
      },
      "success": function(data, text_status, jqr) {

        $(that).find(".nys-loading").remove();

        var json_to_dt = jsonToDataTable(scope, data);
        
        //defualt dt settings
        var dt_settings = {
          "bDestroy": true,
          "aaData": json_to_dt.rows,
          "aoColumns": json_to_dt.columns,
          "bAutoWidth": false
        };

        //combine settings and options
        $.extend(true, dt_settings, scope.settings.datatable);

        //initialize datatables as well as combine options from nysTables object
        $(that).dataTable(dt_settings);

        loadButtons(that, scope);
        listen(that, scope);
        
      }
    });

  };

  function listen_global(scope) {

    $("body").unbind("click");
    $("body").on("click", "#nys-mask", function(e) {

      e.preventDefault();

      $(this).hide();
      $(".window").hide();

    });

  };

  //Master event handler function
  function listen(elem, scope) {

    $(elem).on("click", ".nys-manage a", function(e) {

      e.preventDefault();

      var nRow = $(this).parent().parent();
      //get table name
      var table = nRow.parent().parent().attr("nys-table") || scope.settings.table;
      var pk = nRow.find(".nys-pk").text();

      //launch modal
      editModalLaunch(scope, table, pk);

    });
    
    $(elem).parent(".dataTables_wrapper").on("click", ".nys-refresh", function(e) {

      e.preventDefault();

      init(elem);

    });

    $(elem).on("click", ".nys-fk-col", function(e) {

      e.preventDefault();

      var nRow = $(this).parent().parent();
      //get table name
      var table = $(this).attr("pk_table"); //nRow.parent().parent().attr("nys-table") || scope.settings.table;
      var pk_value = $(this).attr("pk_value");

      showFKModal(scope, table, pk_value);

    });

    if (scope.settings.hasOwnProperty("new_records") || !scope.settings.new_records) {

      $(elem).parent(".dataTables_wrapper").on("click", ".nys-add", function(e) {

        e.preventDefault();

        var table = $(elem).attr("nys-table") || scope.settings.table;

        editModalLaunch(scope, table, 0);

      });

    }

  };

  function loadButtons(elem, scope) {

    var content = '<div class="nys-buttons">';

    if (scope.settings.hasOwnProperty("new_records") || !scope.settings.new_records) {
      content += '<a href="#" class="nys-add">Add Record</a> ';
    }

    content += '<a href="#" class="nys-refresh">Refresh</a>';

    content += '</div>';

    $(elem).parent(".dataTables_wrapper").prepend(content);

  };

  //Get data for modal edit popup modal
  function editModalLaunch(scope, table, pk) {

    setMaskDimensions();

    //transition effect   
    $('#nys-mask').fadeTo("fast", 0.6); 

    $.ajax({
      "url": scope.settings.url,
      "type": "POST",
      "dataType": "json",
      "data": {
        "action": ((pk === 0) ? "get_new_record" : "get_record"),
        "table": table,
        "pk": pk,
        "columns": JSON.stringify(scope.settings.columns)
      },
      "beforeSend": function() {

        $("#nys-boxes #dialog")
          .fadeIn(600)
          .css("text-align", "center")
          .html('<img src="./assets/img/loading.gif" class="nys-loading" />');

      },
      "success": function(data, tet_status, jqr) {

        $("#nys-boxes #dialog")
          .css("text-align", "")
          .html(editModalDisplay(scope, data));

      }
    });

  };

  //Display modal edit popup
  function editModalDisplay(scope, data) {

    var content = '';

    var allow_delete = scope.settings.allow_delete || true;
    for (var i = 0; i < data.length; i++) {

      content += getInputColumn(scope, data[i]) + ' <br />';

      if (data[i].hasOwnProperty("FK") && (data[i].FK.delete_rule === "NO ACTION" || data[i].FK.delete_rule !== null))
        allow_delete = false;

    }

    content += '<hr />';

    content += '<a href="#" class="nys-save">Save</a> <a href="#" class="nys-copy">Copy</a> ';

    if (allow_delete)
      content += '<a href="#" class="nys-delete">Delete</a> ';

    return content;

  };

  function showFKModal(scope, table, pk_value) {

    setMaskDimensions();

    //transition effect   
    $('#nys-mask').fadeTo("fast", 0.6); 

    $.ajax({
      "url": scope.settings.url,
      "type": "POST",
      "dataType": "json",
      "data": {
        "action": "get_fk_record",
        "table": table,
        "value": pk_value,
        "columns": JSON.stringify(scope.settings.columns)
      },
      "beforeSend": function() {

        $("#nys-boxes #dialog")
          .fadeIn(600)
          .css("text-align", "center")
          .html('<img src="./assets/img/loading.gif" class="nys-loading" />');

      },
      "success": function(data, tet_status, jqr) {

        var content = '';

        for (prop in data) {

          if (data[prop] === null)
            continue;

          content += '<strong>' + toTitleCase(prop) + '</strong>: ' + data[prop] + '<br />';

        }

        $("#nys-boxes #dialog")
          .fadeIn(600)
          .css("text-align", "")
          .html(content);

      }
    });

  };

  function setMaskDimensions() {

    //set mask to height and width of page
    var mask_height = $(document).height();
    var mask_width = $(window).width();

    $("#nys-mask").css({
      "height": mask_height,
      "width": mask_width
    });

  };

  function getInputColumn(scope, column) {

    if (column.value === null)
      column.value = "";

    if (column.default === null)
      column.default = "";

    var title = '<span class="nys-input-text">' + toTitleCase(column.name) + '</span>: ';

    if (column.PK)
      return title + (column.value || "(Save First)") + '<input type="hidden" value="' + (column.value || 0) + '" class="nys-input">';

    var condition = {
      "int": '<input type="text" value="' + (column.value || column.default) + '" class="nys-input">',
      "float": '<input type="text" value="' + (column.value || column.default) + '" class="nys-input">',
      "varchar": '<input type="text" value="' + (column.value || column.default) + '" class="nys-input">',
      "text": '<textarea class="nys-input">' + (column.value || column.default) + '</textarea>',
      "bit": 'True <input type="radio" name="" value="1" class="nys-input" ' + ((column.value === 1 || column.default === 1) ? "checked=checked" : "") + '> ' + 
             'False <input type="radio" name="" value="0" class="nys-input" ' + ((column.value === 0 || column.default === 0) ? "checked=checked" : "") + '>',
      "date": '<input type="" value="' + (column.value || column.default) + '" class="nys-input">',
      "datetime": '<input type="" value="' + (column.value || column.default) + '" class="nys-input">',
      "fk": function(foreign_key_info) {

        var content = '<select class="nys-input">';

        for (var i = 0; i < foreign_key_info.data.length; i++) {

          var fk_data = foreign_key_info.data[i];

          content += '<option value="' + fk_data[foreign_key_info.PK] + '">';

          //maximum number of columns to show as the select dropdown text
          var max_cols_show = 3;
          for (prop in fk_data) {
            
            if (max_cols_show === 0) 
              break;

            content += prop + ': ' + fk_data[prop] + ', ';

            max_cols_show--;

          }

          content = content.substring(0, content.length - 2);
          content += '</option>';

        }

        content += '</select>';

        return content;

      }
    };

    $.extend(true, condition, scope.settings.inputs);

    //import override from js settings
    if (scope.settings.hasOwnProperty("columns")
        && $.isArray(scope.settings.columns)
        && scope.settings.columns.length > 0) {

      for (var i = 0; i < scope.settings.columns.length; i++) {

        if (scope.settings.columns[i].column === column.name) {
          $.extend(true, condition, scope.settings.columns[i].inputs);
          break;
        }

      }

    }

    if (condition.hasOwnProperty(column.data_type)) {

      if (column.FK) {
        return title + condition.fk(column.FK);
      }

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

    if (data.data.length > 0) {

      var row_agg = '';
      var first = true;

      for (var i = 0; i < data.data.length; i++) {
          
        row_agg = '<a href="#">Edit</a>,';

        var obj = data.data[i];

        if (first) {

          var col = {};

          if (i === 0) {
            col = { "sTitle": "Manage", "sClass": "nys-manage" };
          } else {
            col = { "sTitle": "Manage" };
          }

          ret.columns.push(col);

          for (var prop in obj) {

            var options = { "sClass": "" };

            //Does data contain primary key property?
            if (data.hasOwnProperty("PK")) {
              
              //found primary key? add a special class for it
              if (prop === data.PK) {
                options.sClass += "nys-pk ";
              }

            }

            //Any foriegn keys?  Do special link behavior
            if (data.hasOwnProperty("FK")) {

              for (var j = 0; j < data.FK.length; j++) {

                fk = data.FK[j];

                if (prop === fk.FK_column) {
                  options.sClass += "nys-fk";
                }

              }

            }

            //determine if configuration includes extra classes
            //to add to the column
            if (scope.settings.hasOwnProperty("columns")
                && $.isArray(scope.settings.columns)
                && scope.settings.columns.length > 0) {

              for (var f = 0; f < scope.settings.columns.length; f++) {

                var col_settings = scope.settings.columns[f];

                if (prop === col_settings.column) {

                  if (col_settings.hasOwnProperty("classes")) {

                    if ($.isArray(col_settings.classes)) {
                      options.sClass += col_settings.classes.join(" ");
                    } else if (typeof col_settings.classes === "string") {
                      options.sClass += col_settings.classes;
                    }

                  }

                  break;

                }

              }

            }

            options.sTitle = toTitleCase(prop);

            ret.columns.push(options);

          }

          first = false;

        }

        for (var prop in obj) {

          if (obj[prop] != null) {
            row_agg += obj[prop].toString().replace(/,/g, '');
          } /*else {
            row_agg += ",";
          }*/

          if (data.hasOwnProperty("FK")) {

          for (var j = 0; j < data.FK.length; j++) {

              fk = data.FK[j];

              if (prop === fk.FK_column) {
                row_agg += ' <a href="#" pk_table="' + fk.PK_table + '" pk_value="' + obj[prop] + '" class="nys-fk-col">View</a>';
              }

            }

          }

          row_agg += ',';
          
        }

        row_agg = row_agg.slice(0, -1);
        ret.rows.push(row_agg.split(","));

      }

    } else {

      ret.columns.push({ "sTitle": "Empty", "sClass": "nys-empty" });
      ret.rows.push(["No records were found in database table."]);

    }

    return ret;

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