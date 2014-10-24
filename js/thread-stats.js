/*
 * thread-stats.js
 *
 * Shows the current number of replies and images in a thread
 *
 */
 
if (active_page == 'ukko' || active_page == 'thread')
$(document).ready(function() {
	var update_stats = function() {
		var total_replies = $('div.post.reply').length;
		var total_images = $('img.post-image').length;
		$('#reply_count').text(total_replies);
		if (total_replies >= reply_limit)	// bump limit
			$('#reply_count').css('font-style', 'italic');
		$('#image_count').text(total_images);
	}
	
	$('#thread-links').after("<div id='thread-stats'><span id='reply_count' title='Replies'></span> / <span id='image_count' title='Images'></span></div>");
	
	$(document).on('new_post', update_stats);
	
	update_stats();
});
