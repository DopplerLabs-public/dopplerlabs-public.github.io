/* Jonathan Snook - MIT License - https://github.com/snookca/prepareTransition */
(function(a){a.fn.prepareTransition=function(){return this.each(function(){var b=a(this);b.one("TransitionEnd webkitTransitionEnd transitionend oTransitionEnd",function(){b.removeClass("is-transitioning")});var c=["transition-duration","-moz-transition-duration","-webkit-transition-duration","-o-transition-duration"];var d=0;a.each(c,function(a,c){d=parseFloat(b.css(c))||d});if(d!=0){b.addClass("is-transitioning");b[0].offsetWidth}})}})(jQuery);

/* replaceUrlParam - http://stackoverflow.com/questions/7171099/how-to-replace-url-parameter-with-javascript-jquery */
function replaceUrlParam(e,r,a){var n=new RegExp("("+r+"=).*?(&|$)"),c=e;return c=e.search(n)>=0?e.replace(n,"$1"+a+"$2"):c+(c.indexOf("?")>0?"&":"?")+r+"="+a};

// HereOne functions
window.hereone = window.hereone || {};

hereone.cacheSelectors = function () {
  hereone.cache = {
    // General
    $html                    : $('html'),
    $body                    : $(document.body),

    // Navigation
    $navigation              : $('#AccessibleNav'),
    $mobileSubNavToggle      : $('.mobile-nav__toggle'),

    // Collection Pages
    $changeView              : $('.change-view'),

    // Product Page
    $productImage            : $('#ProductPhotoImg'),
    $thumbImages             : $('#ProductThumbs').find('a.product-single__thumbnail'),

    // Customer Pages
    $recoverPasswordLink     : $('#RecoverPassword'),
    $hideRecoverPasswordLink : $('#HideRecoverPasswordLink'),
    $recoverPasswordForm     : $('#RecoverPasswordForm'),
    $customerLoginForm       : $('#CustomerLoginForm'),
    $passwordResetSuccess    : $('#ResetSuccess')
  };
};

hereone.init = function () {
  FastClick.attach(document.body);
  hereone.cacheSelectors();
  hereone.accessibleNav();
  hereone.drawersInit();
  hereone.mobileNavToggle();
  hereone.productImageSwitch();
  hereone.responsiveVideos();
};

hereone.accessibleNav = function () {
  var $nav = hereone.cache.$navigation,
      $allLinks = $nav.find('a'),
      $topLevel = $nav.children('li').find('a'),
      $parents = $nav.find('.site-nav--has-dropdown'),
      $subMenuLinks = $nav.find('.site-nav__dropdown').find('a'),
      activeClass = 'nav-hover',
      focusClass = 'nav-focus';

  // Mouseenter
  $parents.on('mouseenter touchstart', function(evt) {
    var $el = $(this);

    if (!$el.hasClass(activeClass)) {
      evt.preventDefault();
    }

    showDropdown($el);
  });

  // Mouseout
  $parents.on('mouseleave', function() {
    hideDropdown($(this));
  });

  $subMenuLinks.on('touchstart', function(evt) {
    // Prevent touchstart on body from firing instead of link
    evt.stopImmediatePropagation();
  });

  $allLinks.focus(function() {
    handleFocus($(this));
  });

  $allLinks.blur(function() {
    removeFocus($topLevel);
  });

  // accessibleNav private methods
  function handleFocus ($el) {
    var $subMenu = $el.next('ul'),
        hasSubMenu = $subMenu.hasClass('sub-nav') ? true : false,
        isSubItem = $('.site-nav__dropdown').has($el).length,
        $newFocus = null;

    // Add focus class for top level items, or keep menu shown
    if (!isSubItem) {
      removeFocus($topLevel);
      addFocus($el);
    } else {
      $newFocus = $el.closest('.site-nav--has-dropdown').find('a');
      addFocus($newFocus);
    }
  }

  function showDropdown ($el) {
    $el.addClass(activeClass);

    setTimeout(function() {
      hereone.cache.$body.on('touchstart', function() {
        hideDropdown($el);
      });
    }, 250);
  }

  function hideDropdown ($el) {
    $el.removeClass(activeClass);
    hereone.cache.$body.off('touchstart');
  }

  function addFocus ($el) {
    $el.addClass(focusClass);
  }

  function removeFocus ($el) {
    $el.removeClass(focusClass);
  }
};

hereone.drawersInit = function () {
  hereone.LeftDrawer = new hereone.Drawers('NavDrawer', 'left');

};

hereone.mobileNavToggle = function () {
  hereone.cache.$mobileSubNavToggle.on('click', function() {
    $(this).parent().toggleClass('mobile-nav--expanded');
  });
};

hereone.getHash = function () {
  return window.location.hash;
};

hereone.productImageSwitch = function () {
  if (hereone.cache.$thumbImages.length) {
    // Switch the main image with one of the thumbnails
    // Note: this does not change the variant selected, just the image
    hereone.cache.$thumbImages.on('click', function(evt) {
      evt.preventDefault();
      var newImage = $(this).attr('href');
      hereone.switchImage(newImage, null, hereone.cache.$productImage);
    });
  }
};

hereone.switchImage = function (src, imgObject, el) {
  // Make sure element is a jquery object
  var $el = $(el);
  $el.attr('src', src);
};

hereone.responsiveVideos = function () {
  var $iframeVideo = $('iframe[src*="youtube.com/embed"], iframe[src*="player.vimeo"]');
  var $iframeReset = $iframeVideo.add('iframe#admin_bar_iframe');

  $iframeVideo.each(function () {
    // Add wrapper to make video responsive
    $(this).wrap('<div class="video-wrapper"></div>');
  });

  $iframeReset.each(function () {
    // Re-set the src attribute on each iframe after page load
    // for Chrome's "incorrect iFrame content on 'back'" bug.
    // https://code.google.com/p/chromium/issues/detail?id=395791
    // Need to specifically target video and admin bar
    this.src = this.src;
  });
};

/*============================================================================
  Drawer modules
  - Docs http://shopify.github.io/Timber/#drawers
==============================================================================*/
hereone.Drawers = (function () {
  var Drawer = function (id, position, options) {
    var defaults = {
      close: '.js-drawer-close',
      open: '.js-drawer-open-' + position,
      openClass: 'js-drawer-open',
      dirOpenClass: 'js-drawer-open-' + position
    };

    this.$nodes = {
      parent: $('body, html'),
      page: $('#PageContainer'),
      moved: $('.is-moved-by-drawer')
    };

    this.config = $.extend(defaults, options);
    this.position = position;

    this.$drawer = $('#' + id);

    if (!this.$drawer.length) {
      return false;
    }

    this.drawerIsOpen = false;
    this.init();
  };

  Drawer.prototype.init = function () {
    $(this.config.open).on('click', $.proxy(this.open, this));
    this.$drawer.find(this.config.close).on('click', $.proxy(this.close, this));
  };

  Drawer.prototype.open = function (evt) {
    // Keep track if drawer was opened from a click, or called by another function
    var externalCall = false;

    // Prevent following href if link is clicked
    if (evt) {
      evt.preventDefault();
    } else {
      externalCall = true;
    }

    // Without this, the drawer opens, the click event bubbles up to $nodes.page
    // which closes the drawer.
    if (evt && evt.stopPropagation) {
      evt.stopPropagation();
      // save the source of the click, we'll focus to this on close
      this.$activeSource = $(evt.currentTarget);
    }

    if (this.drawerIsOpen && !externalCall) {
      return this.close();
    }

    // Notify the drawer is going to open
    hereone.cache.$body.trigger('beforeDrawerOpen.hereone', this);

    // Add is-transitioning class to moved elements on open so drawer can have
    // transition for close animation
    this.$nodes.moved.addClass('is-transitioning');
    this.$drawer.prepareTransition();

    this.$nodes.parent.addClass(this.config.openClass + ' ' + this.config.dirOpenClass);
    this.drawerIsOpen = true;

    // Set focus on drawer
    this.trapFocus(this.$drawer, 'drawer_focus');

    // Run function when draw opens if set
    if (this.config.onDrawerOpen && typeof(this.config.onDrawerOpen) == 'function') {
      if (!externalCall) {
        this.config.onDrawerOpen();
      }
    }

    if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
      this.$activeSource.attr('aria-expanded', 'true');
    }

    // Lock scrolling on mobile
    this.$nodes.page.on('touchmove.drawer', function () {
      return false;
    });

    this.$nodes.page.on('click.drawer', $.proxy(function () {
      this.close();
      return false;
    }, this));

    // Notify the drawer has opened
    hereone.cache.$body.trigger('afterDrawerOpen.hereone', this);
  };

  Drawer.prototype.close = function () {
    if (!this.drawerIsOpen) { // don't close a closed drawer
      return;
    }

    // Notify the drawer is going to close
    hereone.cache.$body.trigger('beforeDrawerClose.hereone', this);

    // deselect any focused form elements
    $(document.activeElement).trigger('blur');

    // Ensure closing transition is applied to moved elements, like the nav
    this.$nodes.moved.prepareTransition({ disableExisting: true });
    this.$drawer.prepareTransition({ disableExisting: true });

    this.$nodes.parent.removeClass(this.config.dirOpenClass + ' ' + this.config.openClass);

    this.drawerIsOpen = false;

    // Remove focus on drawer
    this.removeTrapFocus(this.$drawer, 'drawer_focus');

    this.$nodes.page.off('.drawer');

    // Notify the drawer is closed now
    hereone.cache.$body.trigger('afterDrawerClose.hereone', this);
  };

  Drawer.prototype.trapFocus = function ($container, eventNamespace) {
    var eventName = eventNamespace ? 'focusin.' + eventNamespace : 'focusin';

    $container.attr('tabindex', '-1');

    $container.focus();

    $(document).on(eventName, function (evt) {
      if ($container[0] !== evt.target && !$container.has(evt.target).length) {
        $container.focus();
      }
    });
  };

  Drawer.prototype.removeTrapFocus = function ($container, eventNamespace) {
    var eventName = eventNamespace ? 'focusin.' + eventNamespace : 'focusin';

    $container.removeAttr('tabindex');
    $(document).off(eventName);
  };

  return Drawer;
})();

// Initialize HereOne's JS on docready
$(hereone.init);

jQuery(function($) {
  $('.floating__label_holder input').on('keyup', function(){
    if($(this).val() == ''){
      $(this).closest('.floating__label_holder').removeClass('is_floating');
    }
    else{
      $(this).closest('.floating__label_holder').addClass('is_floating');
    }
  });

  $('.floating__label_holder select').on('change', function(){
    if($(this).val() == ''){
      $(this).closest('.floating__label_holder').removeClass('is_floating');
    }
    else{
      $(this).closest('.floating__label_holder').addClass('is_floating');
    }
  });

  $('.floating__label_holder input, .floating__label_holder select').each(function(){
    if($(this).val() == ''){
      $(this).closest('.floating__label_holder').removeClass('is_floating');
    }
    else{
      $(this).closest('.floating__label_holder').addClass('is_floating');
    }
  });


  lazyLoad();
  videoLoad();
  videoLazyLoad();
  if($('body').hasClass('template-index')){
    heroAdjustments(true);
    $('#hero .continue-arrow').click(function(e) {
      var headerHeight = $('.site-header').outerHeight()-44,
      	  scrollTo = $("#feature-scrollto").offset().top - headerHeight;
      $("html, body").animate({'scrollTop': scrollTo}, 500);
    });
  }
  if($('body').hasClass('template-index') || $('body').hasClass('template-product') || $('body').hasClass('template-page-partner')){
      if($('body').hasClass('template-index')){
		var lastScroll = 0;
      }
      else{
	    var lastScroll = $(window).scrollTop();
      }
    checkScroll();
  }

  $(window).load(function() {
    if($('.submenu:not(.partner-nav-holder)').length > 0){
      checkSubmenuLoad();
    }
  });

  $( window ).resize(function() {
    if($('body').hasClass('template-index')){
      heroAdjustments(false);
    }
    if($('.submenu:not(.partner-nav-holder)').length > 0){
      checkSubmenuScroll();
    }
  });

  $(window).on('scroll', function(){
    lazyLoad();
    videoLazyLoad();
    if($('body').hasClass('template-index') || $('body').hasClass('template-product') || $('body').hasClass('template-page-partner')){
      checkScroll();
    }
    if($('.submenu:not(.partner-nav-holder)').length > 0){
      checkSubmenuScroll();
    }
  });

  function videoLoad(){
    $('video.autoplay:not(.loop)').each(function(){
      	var vid = $(this).get(0);
      	var userAgent = navigator.userAgent || navigator.vendor || window.opera;
      	var isDesktop = true;

    	if (/android/i.test(userAgent)) {
       		isDesktop=false;
    	}
		if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        	isDesktop=false;
    	}
      	if(isDesktop) {
      		$(this).attr("preload","auto");
      		$(this).attr("poster","");
	        $(this).attr("muted","");
    	    $('.volume-control.mute').hide();
        	videoVolumeToggle();
        }
        else{
			$('.volume-control').remove();
        }
    });
  }

  function videoLazyLoad(){
    var userAgent = navigator.userAgent || navigator.vendor || window.opera;
    var isDesktop = true;

    if (/android/i.test(userAgent)) {
       isDesktop=false;
    }
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        isDesktop=false;
    }

    $('video.autoplay.loop').each(function(){
      var wHeight = $(window).height();
      var scrolledTo = $(window).scrollTop();
      var vHeight = $(this).outerHeight();
      var offset = $(this).offset().top - wHeight;
      var offsetHeight = $(this).offset().top + vHeight;

      if(offset < scrolledTo && scrolledTo < offsetHeight){
        if(!$(this).hasClass('playing')){
          var vid = $(this).get(0);
          vid.loop = true;
          //vid.currentTime = 0;
          if(isDesktop) {
            vid.muted = true;
            $(this).removeClass('unmuted');
          }
          $(this).addClass('playing');
          vid.play();
        }
      }
      else {
        var vidid =  $(this).attr('id');
        if(vidid){
          vidid = vidid.replace('video-id-', '');
        }
        var vid = $(this).get(0);
        vid.pause();
        if(isDesktop) {
          vid.mute = true;
          $('.volume-control.mute[data-video-id="'+vidid+'"]').hide();
          $('.volume-control.unmute[data-video-id="'+vidid+'"]').show();
          $(this).removeClass('unmuted');
        }
        $(this).removeClass('playing');
      }
    });

    $('video.autoplay:not(.loop):not(.played)').each(function(){
      var wHeight = $(window).height();
      var scrolledTo = $(window).scrollTop();
      var offset = $(this).offset().top-(wHeight*0.65);

      if(offset < scrolledTo){
				if($(this).closest('.toggled-product-numbered-feature-content').length > 0){
					if($(this).closest('.toggled-product-numbered-feature-content').hasClass('opened')){
						var vid = $(this).get(0);
						$(this).addClass('played');
						vid.play();
					}
				}
				else{
					var vid = $(this).get(0);
					$(this).addClass('played');
					vid.play();
				}
      }
    });
  }

  function videoVolumeToggle(){
    $('.volume-control').on('click', function(e){
      var vidID = $(this).attr('data-video-id');
      var vid = $('#video-id-'+vidID).get(0);

      if($(this).hasClass('mute')){
        vid.muted = true;
        $('#video-id-'+vidID).removeClass('unmuted');
      }
      if($(this).hasClass('unmute')){
        if($('video.unmuted')){
          $('video.unmuted').each(function(){
            var playingvidid = $(this).attr('id').replace('video-id-', '');
            var playingvid = $(this).get(0);
            if(playingvid != vid){
              playingvid.muted = true;
              $('.volume-control.mute[data-video-id="'+playingvidid+'"]').hide();
              $('.volume-control.unmute[data-video-id="'+playingvidid+'"]').show();
            }
          });
        }

        vid.muted = false;
        $('#video-id-'+vidID).addClass('unmuted');
      }
      $(this).hide();
      $(this).siblings('.volume-control').show();
    });
  }

  function lazyLoad(){
//    $('.fade-in:not(.visible)').each(function(){
    $('.fade-in').each(function(){
      var wHeight = $(window).height();
      var scrolledTo = $(window).scrollTop();
      var offset = $(this).offset().top-(wHeight*0.65);

      if(offset < scrolledTo){
        $(this).addClass('visible');
      }
      else{
        $(this).removeClass('visible');
      }
    });
  }

  function heroAdjustments(first) {
    var oiw = $('#hero > img').attr('data-width'),
        oih = $('#hero > img').attr('data-height'),
        width =  $('#hero').width(),
        height = $(window).outerHeight()-$('#header').outerHeight();

    if( ((oiw*height)/oih) < width ){
      var nih = ((oih*width)/oiw),
          niw = width,
          mt = ((height-nih)/2),
          ms = '0';
    }
    else{
      var nih = height,
          niw = ((oiw*height)/oih),
          mt = '0',
          ms = ((width-niw)/2);
    }

    $('#hero').css({'height':height+'px'});
    if(first) {
      $('#hero').css({'min-height':height+'px'});
    }
    if(first || height >= $('#hero').css('min-height').replace('px','')) {
      $('#hero > img').css({'height':nih+'px', 'width':niw+'px', 'margin-top':mt+'px', 'margin-left':ms+'px'});
    }
  }

  function checkScroll(){
    if($('.js-drawer-open-left').parent().css('display') == 'block'){
	  $('body').addClass('scrolled');
    }
    else{
      var scrolledTo = $(window).scrollTop();
      if(scrolledTo > lastScroll){
        $('body').addClass('scrolled');
      }
      else{
        $('body').removeClass('scrolled')
      }

      if($('body').hasClass('template-index')){
		lastScroll = 0;
      }
      else{
		lastScroll = scrolledTo;
      }
    }
  }

  function checkSubmenuLoad(){
    var hash = window.location.hash;
    if(hash){
      if($('a[href='+hash+']').length > 0){
        $('.submenu:not(.partner-nav-holder) a').removeClass('active');
        $('a[href='+hash+']').addClass('active').trigger('click');
      }
    }
  }

  function checkSubmenuScroll(){
    var headerHeight = $('.site-header').outerHeight(),
        scrolledTo = $(window).scrollTop(),
        link = false;

    $('.submenu_section').each(function(){
      var linkScroll = $(this).offset().top-(1+headerHeight);
      if(scrolledTo >= linkScroll){
        var hash = '#'+$(this).attr('id').replace('section_','');
        link = $('a[href='+hash+']');
      }
      else{
        return false;
      }
    });

    if(link){
      $('.submenu:not(.partner-nav-holder) a').removeClass('active');
      window.location.hash = (link.attr('href'));
      link.addClass('active');
    }
  }

  if($('.submenu:not(.partner-nav-holder)').length > 0){
    $('.submenu:not(.partner-nav-holder) a').on('click', function(e){
      window.location.hash = ($(this).attr('href'));
      e.preventDefault();

      var headerHeight = $('.site-header').outerHeight(),
      	  scrollTo = $($(this).attr('href').replace('#','#section_')).offset().top - headerHeight;
      $("html, body").animate({'scrollTop': scrollTo}, 500);
    });
  }
});
