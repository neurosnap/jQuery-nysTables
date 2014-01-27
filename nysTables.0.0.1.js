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

		return this.settings;

	};

	//Initializes datatables and nysTables
	function init(scope) {

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

					var json_to_dt = jsonToDataTable(scope, data.data);
					
					$(that).dataTable($.extend({}, {
						"bDestroy": true,
						"aaData": json_to_dt.rows,
						"aoColumns": json_to_dt.columns
					}, scope.settings.datatable));

				}
			});

		});

	};

	function jsonToDataTable(scope, data) {

		var ret = {
			"columns": [],
			"rows": []
		};
		
		var row_agg = '';
		var first = true;

		for (var i = 0; i < data.length; i++) {

			var obj = data[i];

			if (first) {

				for (var prop in obj) {

					var options = { "sTitle": toTitleCase(prop) }
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