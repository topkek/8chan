/*
 * thread-stats.js
 *
 * Shows the current number of replies and images in a thread
 *
 */

if (active_page == 'ukko' || active_page == 'thread')
$(document).ready(function() {
	var threadid = $('div.thread').attr('id').replace("thread_", "");

	var update_stats = function() {
		var total_replies = $('div.post.reply').length;
		var total_images = $('img.post-image').length;
		$('#reply_count').text(total_replies);
		if (total_replies >= reply_limit)	// bump limit
			$('#reply_count').css('font-style', 'italic');
		$('#image_count').text(total_images);
	}
	
	var update_page = function() {
		var currentPage = 0;
		$.ajax({
			dataType: "json",
			url: "https://8chan.co/"+board_name+"/threads.json",
			success: function(data) {
				$.each(data, function(pageNumber, obj) {
					var threads = obj.threads;
					$.each(threads, function(a, b) {
						if (b.no == threadid) {
							currentPage = pageNumber+1;
							return(false);
						}
					});
				});
				if (currentPage == 0)
					currentPage = "Dead";
				$('#current_page').text(currentPage);
			}
		});
		setTimeout(update_page, 120000);
	}

	$('#thread-links').after("<div id='thread_stats' style='float:right'><span id='reply_count' title='"+_("Replies")+"'></span> / <span id='image_count' title='"+_("Images")+"'></span> / <span id='current_page' title='"+("Page")+"'>?</span></div>");
	
	$(document).on('new_post', update_stats);
	
	update_stats();
	update_page();
});
