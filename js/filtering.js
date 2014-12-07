/*
 * filtering.js
 *
 * Allows users to filter posts by name, trip, email, post body, etc.
 *
 */

if (active_page == 'index' || active_page == 'ukko' || active_page == 'thread')
$(document).ready(function() {
	var filters = {};
	var filtersettings = {};
	var filtertypes = [
		{name: "Name", search: "span.name", exact: "true", info: "Case sensitive, matches exact name. Example: <i>moot</i>"},
		{name: "Tripcode", search: "span.trip", info: "Example: <i>!Ep8pui8Vw2</i> To filter all tripfags, use ! by itself"},
		{name: "Email", search: "a.email", attr: "href", info: "Filter by email address or part of address."},
		{name: "Subject", search: "span.subject", ignorecase: "true", info: "Filter by thread subject. Example: <i>general</i>"},
		{name: "ID", search: "span.poster_id", exact: "true", info: "Filter by poster ID. Example: <i>c6df46</i>"},
		{name: "Flag", search: "img.flag", attr: "title", exact: "true", info: "Filter by country (only on boards with flags). Example: <i>Australia</i>"},
		{name: "Filename", search: "a.download-original", attr: "download", info: "Filter by filename"},
		{name: "Post", search: "div.body", ignorecase: "true", info: "Filter by post text (not case sensitive). Example: <i>gorilla warfare</i>"}];

	//  Set up options tab
	var tabcontents = _("Any posts that match a filter will be hidden. Put each filter on its own line.")+"<br><select id='filter_types_dropdown'>";
	$.each(filtertypes, function(num, type) {
		tabcontents += "<option value='"+num+"'>"+_(type.name)+"</option>";
	});
	tabcontents += "</select><span id='filter_example' style='margin-left:5px'></span>";

	var tab = Options.add_tab("filters", "filter", _("Filters"), tabcontents);

	$.each(filtertypes, function(num, type) {
		$("<textarea class='filter_list' id='filters-"+num+"' data-filter-type='"+type.name+"' rows='10'></textarea>").css({
			"font-size": 12,
			top: 35, bottom: 35,
			width: "calc(100% - 12px)", margin: 0, padding: 0, border: "1px solid black",
			left: 5, right: 5
		}).appendTo(tab.content).hide();
	});

	var submit = $("<input type='button' value='"+_("Save Filters")+"'>").css({
	  position: "absolute",
	  height: 25, bottom: 5,
	  width: "calc(100% - 10px)",
	  left: 5, right: 5
	}).click(function() {
		save_filters();
		filter_all_posts();
	}).appendTo(tab.content);
	
	Options.extend_tab("filters", "<label for='hide-filtered-stubs'><input id='hide-filtered-stubs' class='filter-settings' type='checkbox' /> "+_('Hide filtered post stubs')+"</label>");
	
	$('#filter_types_dropdown').change(function() {
		var selected = $(this).val();
		$('textarea.filter_list').css('display', 'none');
		$('textarea#filters-'+selected).css('display', 'inline');
		$('#filter_example').html(_(filtertypes[selected].info));
	});

	var save_filters = function() {
		var enteredFilters = {};		
		$.each(filtertypes, function(num, type) {
			enteredFilters[type.name] = $('#filters-'+num).val().split("\n");
		});
		filters = enteredFilters;
		localStorage.filters = JSON.stringify(filters);

		filtersettings['hide-filtered-stubs'] = $('#hide-filtered-stubs').is(':checked');
		localStorage.filtersettings = JSON.stringify(filtersettings);

		alert("Filters saved");
	}
	
	// load saved filters
	var load_filters = function() {
		$('#filter_types_dropdown').change();
		if (!localStorage.filters)
			return;
		filters = JSON.parse(localStorage.filters);
		$.each(filters, function(type, saved) {
			saved = saved.join("\n");
			$('textarea.filter_list[data-filter-type='+type+']').val(saved);
			
		});

		if (!localStorage.filtersettings)
			return;
		filtersettings = JSON.parse(localStorage.filtersettings);
		if (filtersettings['hide-filtered-stubs'] === true) {
			$('#hide-filtered-stubs').attr('checked', 'checked');
		}
	}

	var filter_all_posts = function() {
		if (!filters)
			return;
		
		if (active_page == 'index')
			filter_threads();
		
		var posts = $('.reply').not('.filtered');
							
		posts.each(function() {
			filter_post($(this));
		});
	}
	
	var filter_post = function(post) {
		if (!filters)
			return;
		$.each(filtertypes, function(num, type) {
			var filterList = filters[type.name];
			if ((filterList.length == 1) && (filterList[0] == ""))
				return(true);	//continue
			var currentSelector = type.search;
			var textToSearch;
			if (type.attr) {
				textToSearch = post.find(currentSelector).attr(type.attr);
			} else {
				textToSearch = post.find(currentSelector).text();
			}
			if (!textToSearch)
				return(true);	//continue
			textToSearch = textToSearch.trim();
			$.each(filterList, function(i, filterText) {
				if (filterText != "") {
					filterText = filterText.trim();
					if (type.ignorecase === "true") {
						filterText = filterText.toLowerCase();
						textToSearch = textToSearch.toLowerCase();
					}
					var condition = ((type.exact === "true") ? (filterText === textToSearch) : (textToSearch.indexOf(filterText) != -1));
					if (condition) {
						post.trigger('filtered');
						return(false);	//break
					}
				}
			});
		});
	}

	var filter_threads = function() {
		if (!filters)
			return;
		var threads = $('.thread').not('.hiddenthread');
		var ops = threads.find('.op').not('filtered');
		ops.each(function() {
			filter_post($(this));
		});
	}

	$('body').on('filtered', '.post', function() {
		var filtered = $(this);
		if (filtered.hasClass('filtered'))
			return;
		if (filtered.hasClass('op')) {	//hiding a thread
			var parentThread = filtered.closest('.thread');
			filtered.addClass("filtered stub");
			parentThread.addClass('hiddenthread');
			parentThread.find('a.hide-thread-link').first().click();
		} else {	//filtering a reply
			filtered.addClass("filtered stub");
			if ($('#hide-filtered-stubs').is(':checked')) {
				filtered.next().hide();
				filtered.hide();
				return;
			}
			filtered.children().not("p.intro").hide();
			var toggle_button = $("<a href='javascript:void(0)' class='toggle_filtered' data-action='show'>"+_("[Show]")+"</a>");
			toggle_button.click(function() {
				if ($(this).data("action") == "show") {
					$(this).text(_("[Hide]"));
					$(this).data("action", "hide");
					filtered.children().show();
					filtered.removeClass("stub");
				} else { // hide the post
					$(this).text(_("[Show]"));
					$(this).data("action", "show");
					filtered.children().not("p.intro").hide();
					filtered.addClass("stub");
				}
			});
			filtered.find("p.intro > .post_no:last").after(toggle_button);
		}
	});


	load_filters();
	filter_all_posts();
	
	// work with auto-reload.js
	$(document).on('new_post', function(e, post) {
		filter_post($(post));
	});
});