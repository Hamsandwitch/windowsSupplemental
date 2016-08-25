jQuery(function($)
{
	var win = $(window);

	$.fn.lazyLoad = function(ops)
	{
		ops = $.extend(
		{
			event       : 'load+scroll',
			effect      : false,
			delay       : 10,
			timeout     : 10,
			speed       : 100,
			placeHolder : false,
			isHome      : false,
			loadNow     : false
		}, ops);

		if (ops.placeHolder)
			this.each(function()
			{
				var e = $(this),
					w = e.width(),
					h = e.height();

				e.parent().css('display', 'block').css('float', 'left').find(ops.placeHolder).css({top:((h-16)*.5)+'px', left:((w-16)*.5)+'px'}).show();
			});

		$.lazyLoad.initialize.call(this, ops);
		return this;
	}

	$.lazyLoad =
	{
		initialize : function(ops)
		{
			var images = this;

			setTimeout(function()
			{
				if (ops.loadNow === true)
					images.each(function(){ $.lazyLoad.loadImage.call($(this), ops); });
				else
				{
					images.each(function(){ $.lazyLoad.loadIfInView.call(this, ops); });
					$.lazyLoad.clean(images);
					$.lazyLoad.onEvent(ops, images);
				}
			}, ops.delay);
		},

		onEvent : function(ops, images)
		{
			images = images || this;
			if (images.length > 0)
			{
				win.bind('scroll', {images:images, ops:ops}, $.lazyLoad.eventListener);
				win.bind('resize', {images:images, ops:ops}, $.lazyLoad.eventListener);
			}
			else
			{
				win.unbind('scroll', $.lazyLoad.eventListener);
				win.unbind('resize', $.lazyLoad.eventListener);
			}
		},

		eventListener : function(e)
		{
			var images = e.data.images,
				ops    = e.data.ops;

			clearTimeout(images.data('timer'));
			images.data('timer', setTimeout(function()
			{
				images.each(function(){ $.lazyLoad.loadIfInView.call(this, ops); });
				$.lazyLoad.clean(images);
			}, ops.timeout));
		},

		loadImage : function(ops)
		{
			function moveImg()
			{
				$(this).parent().replaceWith(this);
			}

			this.hide().attr('src', this.attr('data-href')).removeAttr('data-href');

			if (ops.placeHolder)
				this.parent().find(ops.placeHolder).remove();

			if (ops.effect && $.isFunction(this[ops.effect]))
				this[ops.effect].call(this, ops.speed).each(moveImg);
			else
				this.show().each(moveImg);
		},

		loadIfInView : function(ops)
		{
			if ($.lazyLoad.inView(this))
				$.lazyLoad.loadImage.call($(this), ops);
		},

		inView : function(el)
		{
			var t = win.scrollTop(),
				l = win.scrollLeft(),
				r = l+win.width(),
				b = t+win.height(),
				o = $(el).offset(),
				w = $(el).width(),
				h = $(el).height();

			return ((t <= (o.top+h)) && (b >= o.top) && (l <= (o.left+w)) && (r >= o.left));
		},

		clean : function(arr)
		{
			var i = 0;
			while (true)
			{
				if (i === arr.length)
					break;

				if (arr[i].getAttribute('data-href'))
					i++;
				else
					arr.splice(i, 1);
			}
		}
	}

	$.parseQuery = function(query, opts)
	{
		var q = (typeof(query) === 'string') ? query : window.location.search,
			o = jQuery.extend({}, {'f':function(v){return unescape(v).replace(/\+/g,' ');}}, (typeof(query) === 'object') ? query : opts),
			p = {};

		if (q.indexOf('#') !== -1)
			q = q.substr(0, q.indexOf('#'));

		if (q.indexOf('?') !== -1)
			q = q.substr(q.indexOf('?'));

		$.each(q.match(/^\??(.*)$/)[1].split('&'), function(i, x)
		{
			x       = x.split('=');
			x[1]    = o.f(x[1]);
			p[x[0]] = (p[x[0]]) ? ((p[x[0]] instanceof Array) ? (p[x[0]].push(x[1]), p[x[0]]) : [p[x[0]], x[1]]) : x[1];
		});

		return p;
	}

	$(window).bind('load', function(e)
	{
		// AJAX: Load comments
		$('#respond').each(function()
		{
			var self = $(this);
			self.bind('loadBox.htg', function(e, replyTo, callback)
			{
				var reply = parseInt(replyTo || $('#commentsWrap').attr('replyto'));

				$.ajax(
				{
					url    : '/wp-admin/admin-ajax.php',
					type   : 'GET',
					data   : 'action=htgAjax&type=postComments&post='+$('#commentsWrap').attr('post')+((reply > 0) ? '&replytocom='+reply : ''),
					success: function(html)
					{
						self.html(html).fadeIn();
						$('#cancel-comment-reply-link').each(function()
						{
							$(this).attr('href', '#'+$.parseQuery($(this).attr('href')).post);
						}).unbind('click.htg').bind('click.htg', function(e)
						{
							// Stop propagation
							e.preventDefault();

							// Ajax
							$('#respond').trigger('loadBox.htg', [0, function(){ $('#comment').focus(); }]);
						});

						if ($.isFunction(callback))
							callback.call(this);
					}
				});
			}).trigger('loadBox.htg');
		});

		// Splashbox
		if ($('#htgSplashBox').length)
		{
			var box     = $('#htgSplashBox');
			var outer   = $('.preview .outer', box);
			var thumb   = $('.thumbs', box);
			var thumbs  = $('span', thumb);
			var bar     = $('.bar', thumb);
			var els     = $('.inner div', outer);
			var width   = els.eq(0).width();
			var extra   = Math.floor((thumbs.eq(0).outerWidth()-thumbs.eq(0).width())/2);
			var current = 0;
			var timer;

			// Internet Explorer 7 CRAP!
			if ($.browser.msie && $.browser.version == '7.0')
				els.each(function(){ $('img', this).css('max-width', width); });

			// Attach the event
			thumbs.unbind('click.htg').bind('click.htg', function(e, auto)
			{
				if (auto !== true)
				{
					clearInterval(timer);
					timer = null;
				}

				current = thumbs.index(this);

				outer.stop().animate({'scrollLeft':els.eq(current).position().left}, 500);
				bar.stop().css('width', $(this).width()).animate({'left':$(this).position().left+extra}, 500);
			});

			// Reset positions on load
			outer.animate({'scrollLeft':0}, 0);
			bar.css({'left':thumbs.eq(0).position().left+extra,'width':thumbs.eq(0).width()}).show();

			// Start auto rotation
			timer = setInterval(function()
			{
				current++;
				if (current >= thumbs.length)
					current = 0;

				thumbs.eq(current).trigger('click.htg', [true]);
			}, splashboxSpeed || 6500);

			// Set initial width
			$('.inner', outer).css('width', els.length*width);
		}

		// Navigation Bar
		$('#htgNavBar').each(function()
		{
			var zIndex = 100;
			var bar    = $(this);

			function hoverOver()
			{
				var self = $(this);

				self.find('.subMenu').stop().css('z-index', zIndex++).fadeTo('fast', 1).show();
				if (self.find('.menuRow').length)
				{
					var row = 0;
					self.find('.menuRow').each(function()
					{
						var width = $(this).calcSubWidth();
						if (width > row)
							row = width;
					});

					self.find('.subMenu').css('width', row);
					self.find('.menuRow:last').css('margin', '0');
				}
				else
					self.find('.subMenu').css('width', $(this).calcSubWidth());
			}

			function hoverOut()
			{
				$(this).find('.subMenu').stop().fadeTo('fast', 0, function()
				{
					$(this).hide();
				});
			}

			bar.find('ul li .subMenu').css('opacity', '0');
			bar.find('ul li').hoverIntent(
			{
				sensitivity: 2,
				interval   : 100,
				timeout    : 500,
				over       : hoverOver,
				out        : hoverOut
			});

			// Ensure hashed links don't go to the top of the page when clicked
			bar.find('li a[href=#]').bind('click', function(e)
			{
				e.preventDefault();
				return false;
			});


			// load the search box. who needs ajax for static content?
			bar.find('.search').each(function()
			{
				var html = "<form action='http://www.howtogeek.com/sitesearch/' id='searchbox_009481737823548119489:w5lekpyovpo'><input type='hidden' name='cx' value='009481737823548119489:w5lekpyovpo' /><input type='hidden' name='cof' value='FORID:9' /><input type='text' name='q' class='q' /></form><script type='text/javascript' src='http://www.google.com/coop/cse/brand?form=searchbox_009481737823548119489%3Aw5lekpyovpo&lang=en'></script><div style='clear:both'></div>";
				var self = $(this);
				self.html(html);
			});
		});
		
		// Top Bar
		$('.topBar').each(function()
		{
			var zIndex = 100;
			var bar    = $(this);
		
			// AJAX load the user links (login/signup | profile/logout)
			bar.find('.userLinks').each(function()
			{
				var self = $(this);
				$.ajax(
				{
					url    : '/commonphp/ajaxcache/userlinks.php?post='+$('#commentsWrap').attr('post'),
					type   : 'GET',
					data   : 'action=htgAjax&type=userLinks',
					success: function(html)
					{
						self.html(html);
					}
				});
			});		
		
		});
		
		// Widgets!
		$('.htgWidget').each(function()
		{
			var self = $(this);

			// Hide widget links
			$('a.hideWidget', self).bind('click', function(e)
			{
				e.preventDefault();

				// Set the cookie....
				jQuery.cookie(self.attr('id'), '1', {expires:365, path:'/'});

				// Fade out and goodbye
				self.fadeOut(function()
				{
					self.hide();
				});

				return false;
			});

			// Auto-hide?
			if (jQuery.cookie(self.attr('id')) !== '1')
				self.show();
		});
		
		// Article Page
		if ($('#htgArticle').length)
			$('#htgArticle').each(function()
			{
				$(this).append('<img src="'+statsUrl+'" alt="" id="htgstats" style="display:none" />');
				var html = "<li class='gplus'><g:plusone size='medium' count='false'></g:plusone><script type='text/javascript'>(function(){ var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true; po.src = 'https://apis.google.com/js/plusone.js'; var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s); })();</script></li><li class='twitter'><a href='http://twitter.com/share' class='twitter-share-button' data-text='' data-count='none'>Tweet</a><script type='text/javascript' src='http://platform.twitter.com/widgets.js'></script></li><li class='print'><a href='JavaScript:window.print();' ><img src='http://www.howtogeek.com/geekers/up/sshot4db5f1222d9d0.png' /></a></li>";
				$('.sharinglinks', this).html(html);

				// Featured thumbs
				$('.featured', this).load('/commonphp/ajaxcache/featthumbs.php', 'action=htgAjax&type=featThumbs');

				// Reply comment links!
				$('a.comment-reply-link', this).removeAttr('onclick').unbind('click.htg').bind('click.htg', function(e)
				{
					// Stop propagation
					e.preventDefault();

					// Scroll to box
					$('html, body').animate({scrollTop: $('#respond').offset().top+Math.floor($('#respond').height()/2)}, 1000);

					// Ajax
					$('#respond').trigger('loadBox.htg', [$.parseQuery($(this).attr('href')).replytocom, function(){ $('#comment').focus(); }]);
				});

				// Load more comments
				$('#loadMoreComments').bind('click', function(e)
				{
					$('#hideComments').show();
					$(this).remove();
				});

				// Hash check
				try
				{
					if (window.location.hash.indexOf('comment') >= 0)
						$('#loadMoreComments').trigger('click');
				}
				catch(me){}
			});

		// Detect AdBlock
		if (false)
			setTimeout(function()
			{
				$('.adBlockCheck').each(function()
				{
					if (!$(this).height())
						$(this).after("<div><h3>Y U NO LIKE ADS?!?!</h3></div>");
				});
			}, 1000);
	});
});

var googleAdClient="pub-1894578950532504";var TMNadsenseCount=0;function setStyle(){styles="<style>\n";styles+=".tmnAdsenseContainer  {float:left; padding:10px; .padding:5px; padding-top:15px; .padding-top:10px; padding-bottom:15px; .padding-bottom:10px;}\n";styles+=".tmnAdsByGoogleCont   {float:left;}\n";styles+=".tmnAdsByGoogle       {font-size:12px; float:left; text-align:right;}\n";styles+=".tmnAdsByGoogle a     {color:#777777; text-decoration:none; font-size:11px;}\n";styles+=".tmnAdsenseAdCont     {float:left; overflow:hidden;}\n";styles+=".tmnAdsenseAdTitle    {margin-bottom:5px;}\n";styles+=".tmnAdsenseAdTitle a  {text-decoration:none; font-size:15px; color:#4444DD; font-weight: bold;}\n";styles+=".tmnAdsenseAdDescCont {}\n";styles+=".tmnAdsenseAdDesc     {color:#000000; font-size:11px;}\n";styles+=".tmnAdsenseAdLink     {}\n";styles+=".tmnAdsenseAdLink a   {color:#999999; text-decoration:none; font-size:11px;}\n";styles+="</style>\n";document.write(styles)}setStyle();var TmnAdsense={checkHex:function(a){return a.match(/^(?:#)?([0-9A-Fa-f]{6})$/)},display:function(g){if(TMNadsenseCount<3){TMNadsenseCount++;if(!g){g=TmnAdsense.options}var e=new Date();var c=e.getTime();if(!g.width||g.width<100){g.width=100}if(!g.ad_width){g.ad_width=100}if(g.ad_width>g.width){g.ad_width=g.width}if(!g.max_ads||g.max_ads<1){g.max_ads=2}if(g.max_ads>6){g.max_ads=6}if(!g.channel_id){g.channel_id=null}if(!g.col_margin){g.col_margin=0}if(!g.row_margin){g.row_margin=14}if(g.adsbyposition!="topleft"){g.adsbyposition="bottomright"}if(!g.adsbyvertical){g.adsbyvertical=10}if(!g.adsbyhorizontal){g.adsbyhorizontal=86}else{g.adsbyhorizontal+=86}var a=0;var b="";if(typeof(g.adFontFamily)=="string"){b+="font-family:"+g.adFontFamily+";"}var l="";if(typeof(g.adsbyFontSize)=="number"){l+="font-size:"+g.adsbyFontSize+"px;"}if(typeof(g.adsbyFontFamily)=="string"){l+="font-family:"+g.adsbyFontFamily+";"}if(typeof(g.adsbyFontWeight)=="string"){l+="font-weight:"+g.adsbyFontWeight+";"}if(typeof(g.adsbyColor)=="string"&&!!(a=TmnAdsense.checkHex(g.adsbyColor))){l+="color:#"+a[1]+";"}var j='style="';if(typeof(g.titleFontSize)=="number"){j+="font-size:"+g.titleFontSize+"px;"}if(typeof(g.titleFontFamily)=="string"){j+="font-family:"+g.titleFontFamily+";"}if(typeof(g.titleFontWeight)=="string"){j+="font-weight:"+g.titleFontWeight+";"}if(typeof(g.titleDecoration)=="string"){j+="text-decoration:"+g.titleDecoration+";"}if(typeof(g.titleFontColor)=="string"&&!!(a=TmnAdsense.checkHex(g.titleFontColor))){j+="color:#"+a[1]+";"}var k='style="';if(typeof(g.titleMarginBottom)=="number"){k+="margin-bottom:"+g.titleMarginBottom+"px;"}var i='style="';if(typeof(g.descFontSize)=="number"){i+="font-size:"+g.descFontSize+"px;"}if(typeof(g.descFontFamily)=="string"){i+="font-family:"+g.descFontFamily+";"}if(typeof(g.descDecoration)=="string"){i+="text-decoration:"+g.descDecoration+";"}if(typeof(g.descLineSpacing)=="number"){i+="line-height:"+g.descLineSpacing+"px;"}if(typeof(g.descFontColor)=="string"&&!!(a=TmnAdsense.checkHex(g.descFontColor))){i+="color:#"+a[1]+";"}if(typeof(g.descFontWeight)=="string"){i+="font-weight:"+g.descFontWeight+";"}var f='style="';if(typeof(g.linkFontSize)=="number"){f+="font-size:"+g.linkFontSize+"px;"}if(typeof(g.linkFontFamily)=="string"){f+="font-family:"+g.linkFontFamily+";"}if(typeof(g.linkDecoration)=="string"){f+="text-decoration:"+g.linkDecoration+";"}if(typeof(g.linkFontColor)=="string"&&!!(a=TmnAdsense.checkHex(g.linkFontColor))){f+="color:#"+a[1]+";"}if(typeof(g.linkFontWeight)=="string"){i+="font-weight:"+g.linkFontWeight+";"}if(!g.adsOnRow){var h=Math.floor(g.width/g.ad_width)}else{var h=g.adsOnRow}d='<script type="text/javascript">\n';d+="<!--\n";d+="if(typeof(google_adnum) == 'undefined'){\n";d+="var google_adnum = 0;\n";d+="}\n";d+="function google_ad_request_done(google_ads){\n";d+="var s='';\n";d+="if(google_ads.length == 0){\n";d+="return;\n";d+="}\n";d+="if(google_ads.length != 0){\n";d+='s+=\'<div class="tmnAdsenseContainer" style="width: '+g.width+"px;\">'\n";if(g.adsbyposition=="topleft"){d+='s+=\'<div class="tmnAdsByGoogleCont" style="width: '+g.width+"px;padding-bottom:"+g.adsbyvertical+"px\">'\n";d+="s+='  <div style=\"width:"+g.adsbyhorizontal+'px"class="tmnAdsByGoogle">\'\n';d+="s+='    <a style=\"float:right;"+l+'" href="\' + google_info.feedback_url + \'" class="tmnAdsByGoogle">Ads by Google</a>\'\n';d+="s+='  </div>'\n";d+="s+='</div>'\n"}d+="var marginR=0;\n";d+="var marginB=0;\n";d+="var numAds="+(h-1)+";\n";d+="var ad_less="+(h-1)+";\n";d+="for(var i = 0; i < google_ads.length; ++i){\n";d+="marginR=((i < ad_less)?"+g.col_margin+":0);\n";d+="if (i >= ad_less) {ad_less = (ad_less + "+(h)+");}\n";d+="marginB=(i < ((google_ads.length-1) - numAds)?"+g.row_margin+":0);\n";d+='s+=\'<div class="tmnAdsenseAdCont" style="width: '+g.ad_width+"px;margin-right:' + marginR + 'px; margin-bottom:'+ marginB +'px;"+b+"\">'\n";d+='s+=\'  <div class="tmnAdsenseAdTitle" '+k+"\">'\n";d+='s+=\'    <a class="tmnAdsenseAdTitle" href="\' + google_ads[i].url + \'" '+j+"\">' + google_ads[i].line1 + '</a>'\n";d+="s+='  </div>'\n";d+="s+='  <div class=\"tmnAdDescCont\">'\n";d+='s+=\'    <span class="tmnAdsenseAdDesc" '+i+"\">' + google_ads[i].line2 + ' ' + google_ads[i].line3 + '</span>'\n";d+="s+='    <div class=\"tmnAdsenseAdLink\">'\n";d+='s+=\'      <a class="tmnAdsenseAdLink" href="\' + google_ads[i].url + \'" '+f+"\">'\n";d+="s+='        <span>' + google_ads[i].visible_url + '</span>'\n";d+="s+='      </a>'\n";d+="s+='    </div>'\n";d+="s+='  </div>'\n";d+="s+='</div>'\n";d+="}\n";if(g.adsbyposition=="bottomright"){d+='s+=\'<div class="tmnAdsByGoogleCont" style="padding-top:'+g.adsbyvertical+"px;width: "+g.width+"px;\">'\n";d+='s+=\'  <div class="tmnAdsByGoogle" style="float:right;width:'+g.adsbyhorizontal+"px\">'\n";d+="s+='    <a style=\"float:left;"+l+'" href="\' + google_info.feedback_url + \'" class="tmnAdsByGoogle">Ads by Google</a>\'\n';d+="s+='  </div>'\n";d+="s+='</div>'\n"}d+="s+='</div>'\n";d+='if (google_ads[0].bidtype == "CPC") {\n';d+="google_adnum=google_adnum + google_ads.length;\n";d+="}\n";d+="}\n";d+="document.write(s);\n";d+="return;\n";d+="}\n";d+="google_ad_client='"+googleAdClient+"';\n";if(g.channel_id){d+="google_ad_channel='"+g.channel_id+"';\n"}d+="google_ad_output='js';\n";d+="google_max_num_ads='"+g.max_ads+"';\n";d+="google_ad_type='text_html';\n";d+="google_feedback='on';\n";d+="google_skip=google_adnum;\n";d+="-->\n";d+="<\/script>\n";d+='<script src="http://pagead2.googlesyndication.com/pagead/show_ads.js?'+c+'"><\/script>';document.write(d)}},options:{width:315,ad_width:315,max_ads:4,adsOnRow:1,col_margin:0,titleFontSize:15,titleFontColor:"4444DD",descFontSize:11,descFontColor:"000000",linkFontSize:11,linkFontColor:"999999"}};
