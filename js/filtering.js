if (active_page == 'index' || active_page == 'ukko' || active_page == 'thread')
$(document).ready(function() {
	var filtertypes = [
		{name: "Name", search: "span.name", exact: "true", info: "Case sensitive, matches exact name. Example: <i>moot</i>"},
		{name: "Tripcode", search: "span.trip", info: "Example: <i>!Ep8pui8Vw2</i> To filter all tripfags, use ! by itself"},
		{name: "Email", search: "a.email", attr: "href", info: "Filter by email address or part of address."},
		{name: "Subject", search: "span.subject", ignorecase: "true", info: "Filter by thread subject. Example: <i>general</i>"},
		{name: "ID", search: "span.poster_id", exact: "true", info: "Filter by poster ID. Example: <i>c6df46</i>"},
		{name: "Flag", search: "img.flag", attr: "title", exact: "true", info: "Filter by country (only on boards with flags). Example: <i>Australia</i>"},
		{name: "Post", search: "div.body", ignorecase: "true", info: "Filter by post text (not case sensitive). Example: <i>gorilla warfare</i>"}];

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
		console.log(localStorage.filters);
		alert("Filters saved");
	}
	
	// load saved filters into the options dialog
	var filters;
	var load_filters = function() {
		$('#filter_types_dropdown').change();
		if (!localStorage.filters)
			return;
		filters = JSON.parse(localStorage.filters);
		$.each(filters, function(type, saved) {
			saved = saved.join("\n");
			$('textarea.filter_list[data-filter-type='+type+']').val(saved);
			
		});
	}
	
	var filter_all_posts = function() {
		var t0 = performance.now();
		if (!filters)
			return;
		var posts = $('.reply').not('.filtered');
							
		posts.each(function() {
			filter_post($(this));
		});
		var t1 = performance.now();
		console.log("Call to filter_all_posts took " + (t1 - t0) + "ms.")
	}
	
	var filter_post = function(post) {
		if (!filters)
			return;
		$.each(filtertypes, function(num, type) {
			var filterList = filters[type.name];
			if (filterList.length == 1)
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
	
	$('body').on('filtered', '.reply', function() {
		var filtered = $(this);
		if (filtered.hasClass('filtered'))
			return;
		/*if (filtered.hasClass('op')) {
			filtered.closest('div.thread').find('a.hide-thread-link').first().click();
			return;
		}*/
		filtered.addClass("filtered stub");
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
	});

	
	load_filters();
//	filter_all_posts();
	
	// work with auto-reload.js
	$(document).on('new_post', filter_all_posts());
});