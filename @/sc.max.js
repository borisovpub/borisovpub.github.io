!function( /* Window */ window ) {

	/** @type {Location|String} */
	var location = window.location;
	/** @type {History} */
	var history = window.history;

	/** @type {string} */
	var userAgent = window.navigator.userAgent;
	/** @type {HTMLDocument} */
	var document = window.document;
	/** @type {Element} */
	var documentElement = document.documentElement;

	var Date = window.Date;
	var Object = window.Object;
	var FunctionPrototype = window.Function.prototype;

	/**
	 * @param {Function} func
	 * @return {Function}
	 */
	var getNativeFunction = function(func) {
		return typeof func == 'function' && /function\s+\w+\(\)\s*{\s*\[native code]\s*}/.test( FunctionPrototype.toString.call( func ) ) && func;
	};

	/** @type {function(Object, ...*):*} */
	var FunctionCall = FunctionPrototype.call;
	/** @type {function(Object):Function} */
	var FunctionBind = getNativeFunction( FunctionPrototype.bind );

	/** @type {function(Function, Object):Function} */
	var bind = ( FunctionBind
		? FunctionCall.bind( FunctionBind )
		: function(func, context) {
			return function() {
				return func.apply( context, arguments );
			};
		}
	);
	/** @type {function(Function):Function} */
	var unbind = ( FunctionBind
		? FunctionBind.bind( FunctionCall )
		: function(func) {
			return function() {
				return FunctionCall.apply( func, arguments );
			};
		}
	);
	/** @type {function(Function):Function} */
	var unbindNonEmpty = function(func) { return func && unbind( func ) };

	/** @type {function(Object, PropertyKey):boolean} */
	var hasOwnProperty = unbind( Object.prototype.hasOwnProperty );
	/** @type {function(*, *):*} */
	var assign = getNativeFunction( Object.assign ) || function(target, source) {
		for ( var o in source ) {
			if ( hasOwnProperty( source, o ) && source[ o ] ) {
				target[ o ] = source[ o ];
			}
		}
		return target;
	};

	/** @type {function(EventTarget, string, Function, boolean=):void} */
	var addEventListener = unbind( documentElement.addEventListener );
	/** @type {function(EventTarget, string, Function, boolean=):void} */
	var removeEventListener = unbind( documentElement.removeEventListener );

	/** @type {function(Element, string):string} */
	var getAttribute = unbind( documentElement.getAttribute );
	/** @type {function(Element, string, *):void} */
	var setAttribute = unbind( documentElement.setAttribute );
	/** @type {function(Node, Node):Element} */
	var appendChild = unbind( documentElement.appendChild );
	/** @type {function(Node):void} */
	var removeChild = unbindNonEmpty( getNativeFunction( documentElement[ 'remove' ] ) ) || function(node) { var parent = node.parentNode; if ( parent ) parent.removeChild( node ) };

	/** @type {function(string):Element} */
	var createElement = bind( document.createElement, document );
	/** @type {function(string):Element} */
	var querySelector = bind( document.querySelector, document );
	/** @type {function(string):Element} */
	var querySelectorAll = bind( document.querySelectorAll, document );
	/** @type {function(Element, string):Element} */
	var queryElementSelector = unbind( documentElement.querySelector );

	/** @type {function((Function|string), number=, ...*):number} */
	var setTimeout = window.setTimeout;
	/** @type {function(number):void} */
	var clearTimeout = window.clearTimeout;

	var head = /** @type {HTMLHeadElement} */ querySelector( 'head' );

	/**
	 * @param {string} src
	 * @param {HTMLElement} [parent]
	 * @returns {HTMLLinkElement}
	 */
	var createLink = function(src, parent) {

		var link = createElement( 'link' );

		setAttribute( link, 'type', 'text/css' );
		setAttribute( link, 'rel', 'stylesheet' );
		setAttribute( link, 'href', src );

		return /** @type {HTMLLinkElement} */ appendChild( parent || head, link );

	};

	/**
	 * @param {string} src
	 * @param {HTMLElement} [parent]
	 * @returns {HTMLIFrameElement}
	 */
	var createIFrame = function(src, parent) {

		var iframe = createElement( 'iframe' );

		setAttribute( iframe, 'src', src );
		setAttribute( iframe, 'allowTransparency', true );
		setAttribute( iframe, 'scrolling', 'no' );

		return /** @type {HTMLIFrameElement} */ appendChild( parent, iframe );

	};

	/**
	 * @param {string} src
	 * @param {HTMLElement} [parent]
	 * @returns {HTMLScriptElement}
	 */
	var createScript = function(src, parent) {

		var script = createElement( 'script' );

		setAttribute( script, 'type', 'text/javascript' );
		setAttribute( script, 'async', 'async' );
		setAttribute( script, 'src', src );

		return /** @type {HTMLScriptElement} */ appendChild( parent || head, script );

	};

	/**
	 * @param {HTMLScriptElement} script
	 * @param {Function} handle
	 * @returns {void}
	 */
	var onScriptLoad = function(script, handle) {

		function onload() {
			var readyState = script[ 'readyState' ];
			if ( !readyState || readyState == 'loaded' || readyState == 'complete' ) {
				removeEventListener( script, 'load', onload );
				removeEventListener( script, 'onreadystatechange', onload );
				removeChild( script );
				handle();
			}
		}

		addEventListener( script, 'load', onload );
		addEventListener( script, 'readystatechange', onload );

	};

	/**
	 * @param {HTMLIFrameElement} iframe
	 * @param {Function} handle
	 * @returns {void}
	 */
	var onIFrameLoad = function(iframe, handle) {

		addEventListener( iframe, 'load', function onload() {
			removeEventListener( iframe, 'load', onload );
			handle();
		} );

	};

	/**
	 * @param {HTMLImageElement} media
	 * @param {Function} handle
	 * @returns {void}
	 */
	var onMediaLoad = function(media, handle) {

		if ( media[ 'complete' ] || media[ 'readyState' ] ) handle( media );
		else {

			var onload = function() {
				removeEventListener( media, 'load', onload );
				removeEventListener( media, 'loadedmetadata', onload );
				handle( media );
			};

			addEventListener( media, 'load', onload );
			addEventListener( media, 'loadedmetadata', onload );

		}

	};

	var ga = window[ 'ga' ] = assign( function ga() { ga[ 'q' ].push( arguments ) }, { 'q': [], 'l': 1 * new Date() } );

	var active;

	var arr, i, l;

	// подменяем историю
	if ( location.search && history ) history.replaceState( null, document.title, location.pathname );

	createLink( '//fonts.googleapis.com/css?family=Open+Sans|Caveat' );
	createLink( '/@/sd.max.css' );

	// фиксим ссылки
	arr = querySelectorAll( 'a' );
	i = 0; l = arr.length;
	for ( ; i<l; ++i ) ( function(a) {
		var href = getAttribute( a, 'data-href' );
		href && addEventListener( a, 'click', function() {
			window.open( href, getAttribute( a, 'target' ) );
			return false;
		} );
	}( arr[ i ] ) );

	// кликабельные елементы правим
	arr = querySelectorAll( '[data-active]' );
	i = 0; l = arr.length;
	for ( ; i<l; ++i ) ( function(e) {

		var button = queryElementSelector( e, '[data-button]' ) || e;
		var content = queryElementSelector( e, '[data-content]' ) || e;

		addEventListener( button, 'click', function() {
			if ( active ) setAttribute( active, 'class', '' );
			active = content;
			setAttribute( content, 'class', getAttribute( content, 'class' ) ? '' : 'hover' );
		} );

		addEventListener( button, 'mouseenter', function() {
			if ( active && !active.contains( button ) ) {
				setAttribute( active, 'class', '' );
			}
		} );

	}( arr[ i ] ) );

	// deactivate
	addEventListener( documentElement, 'click', function(event) {
		if ( active && !active.contains( event.target ) ) {
			setAttribute( active, 'class', '' );
		}
	} );

	// background resize
	( i = querySelector( '#bg>video,#bg>img' ) ) && onMediaLoad( i, function(target) {

		var style = target.style;
		var is = ( target.naturalWidth || target.videoWidth ) / ( target.naturalHeight || target.videoHeight );

		var update = function() {

			var s = ( window.innerWidth / window.innerHeight ) / is;
			style.msTransform = style.transform =
				'translateX(-50%)' + ( s > 1 ? 'scale(' + s + ')' : '' );

		};

		update();

		window.addEventListener( 'resize', update );

	} );

	// social buttons
	if ( !/MSIE/.test( userAgent ) && ( i = querySelector( '#social' ) ) ) ( function( /** Element */ social ) {

		/**
		 * @param {Element} element
		 * @param {function(Element):void} handle
		 * @returns {void}
		 */
		var createSocial = function(element, handle) {

			addEventListener( element, 'mouseenter', function mouseEnterOnce() {

				removeEventListener( element, 'mouseenter', mouseEnterOnce );

				var timerID;

				var container = appendChild( element, createElement( 'div' ) );

				setAttribute( container, 'class', 'social reset empty' );
				container.getBoundingClientRect();
				setAttribute( container, 'class', 'social empty' );

				addEventListener( element, 'mouseenter', mouseEnter );
				addEventListener( element, 'mouseleave', mouseLeave );

				function mouseEnter() {
					timerID = setTimeout( function() {

						removeEventListener( element, 'mouseenter', mouseEnter );
						removeEventListener( element, 'mouseleave', mouseLeave );

						handle( container );

						var loadTimeout = function() {
							setTimeout( function() {
								setAttribute( container, 'class', 'social' );
							}, 500 );
						};

						var loadIFrame = function()  {
							var iframe = /** @type {HTMLIFrameElement} */ queryElementSelector( container, 'iframe' );
							if ( iframe ) onIFrameLoad( iframe, loadTimeout );
							else loadTimeout();
						};

						var loadScript = function() {
							var script = /** @type {HTMLScriptElement} */ queryElementSelector( container, 'script' );
							if ( script ) onScriptLoad( script, function() {
								setTimeout( loadIFrame );
							} );
							else loadIFrame();
						};

						loadScript();

					}, 200 );
				}

				function mouseLeave() {
					clearTimeout( timerID );
				}

				mouseEnter();

			} );

			if ( /Trident/.exec( userAgent ) ) {

				addEventListener( element, 'mouseenter', function() {
					setAttribute( element, 'class', 'hover' );
				} );

				addEventListener( element, 'mouseleave', function() {
					setAttribute( element, 'class', '' );
				} );

			}

		};

		var o;

		// vk.com
		( o = queryElementSelector( social, '#vk' ) ) && createSocial( o, function(container) {

			var widget = /** @type {HTMLDivElement} */ appendChild( container, createElement( 'div' ) );
			var script = /** @type {HTMLScriptElement} */ appendChild( widget, createScript( '//vk.com/js/api/openapi.js?152' ) );

			setAttribute( widget, 'id', 'vk_widget' );

			onScriptLoad( script, function() {

				window[ 'VK' ][ 'Widgets' ][ 'Group' ](
					'vk_widget', {
						'mode': 3,
						'wide': 1,
						'width': 320,
						'height': 208
					},
					34963172
				);

			} );

		} );

		// facebook.com
		( o = queryElementSelector( social, '#fb' ) ) && createSocial( o, function(container) {

			var widget = createIFrame( '//www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fborisovpub%2F&tabs&width=320&&hide_cta=true', container );

			setAttribute( widget, 'width', '320' );
			setAttribute( widget, 'height', '214' );

		} );

		// ok.ru
		( o = queryElementSelector( social, '#ok' ) ) && createSocial( o, function(container) {

			var widget = /** @type {HTMLDivElement} */ appendChild( container, createElement( 'div' ) );
			var script = /** @type {HTMLScriptElement} */ appendChild( widget, createScript( '//connect.ok.ru/connect.js' ) );

			setAttribute( container, 'id', 'ok_C' );
			setAttribute( widget, 'id', 'ok_widget' );

			onScriptLoad( script, function() {

				window[ 'OK' ][ 'CONNECT' ][ 'insertGroupWidget' ](
					'ok_widget',
					'52315126759665',
					'{"width":320,"height":285}'
				);

			} );

		} );

		// instagram.com
		( o = queryElementSelector( social, '#ig' ) ) && createSocial( o, function(container) {

			var widget = /** @type {HTMLElement} */ appendChild( container, createElement( 'blockquote' ) );
			var anchor = /** @type {HTMLAnchorElement} */ appendChild( widget, createElement( 'a' ) );

			appendChild( widget, createScript( '//platform.instagram.com/ru_RU/embeds.js' ) );

			setAttribute( widget, 'class', 'instagram-media' );
			setAttribute( widget, 'data-instgrm-version', '7' );

			widget.style.width = '320px';

			setAttribute( anchor, 'href', '//www.instagram.com/p/BGFV2KpmwIY/' );

		} );

	}( i ) );

	// menu
	if ( querySelector( '#menu' ) ) ( function() {

		createScript( '//carte.by/source/front/api.js' );

	}() );

	// mozgoboj
	if ( querySelector( '#mozgoboj' ) ) ( function() {

		var main = querySelector( 'main' );
		var bg = querySelector( '#bg' );
		var next = appendChild( bg, createElement( 'div' ) );

		var nextText = appendChild( next, createElement( 'span' ) );
		var nextTime = appendChild( next, createElement( 'time' ) );

		var widget = /** @type {HTMLDivElement} */ appendChild( main, createElement( 'div' ) );
		var script = /** @type {HTMLScriptElement} */ appendChild( widget, createScript( '//vk.com/js/api/openapi.js?152' ) );

		var D = getAttribute( bg, 'data-d' );
		var H = getAttribute( bg, 'data-h' );
		var M = getAttribute( bg, 'data-m' );
		var S = getAttribute( bg, 'data-s' );

		var update = function() {

			var t, d = new Date( 1209600e3 - ( ( new Date() ).getTime() - 1518361200e3 ) % 1209600e3 );

			nextTime.textContent =
				( ( t = d.getUTCDate() - 1 ) > 0 ? t + D + '. ' : '' ) +
				( ( t = d.getUTCHours()    ) > 0 ? t + H + '. ' : '' ) +
				( ( t = d.getUTCMinutes()  ) > 0 ? t + M + '. ' : '' ) +
				( ( t = d.getUTCSeconds()  ) > 0 ? t + S + '.'  : '' ) ;

		};

		nextText.textContent = getAttribute( bg, 'data-next' ) + ':';

		update();

		setInterval( update, 1e3 );

		setAttribute( widget, 'id', 'vk_widget' );

		onScriptLoad( script, function() {

			window[ 'VK' ][ 'Widgets' ][ 'CommunityMessages' ](
				'vk_widget', 87610892, {
					'tooltipButtonText': getAttribute( main, 'data-q' ),
					'expandTimeout': 60000,
					'disableButtonTooltip': ( window.innerWidth < 549 ? 1 : 0 ),
					'onCanNotWrite': function() {
						window[ 'VK' ][ 'Widgets' ][ 'CommunityMessages' ][ 'destroy' ]( 'vk_widget' );
					}
				}
			);

		} );


	}() );

	// Google Analitics
	createScript( '//www.google-analytics.com/analytics.js' );
	ga( 'create', 'UA-29836360-1', 'auto' );
	ga( 'require', 'GTM-MDJMFT6' );
	ga( 'send', 'pageview' );

	// по идеи должен автоматом спрятать полосу прокрутки в мобилках
	setTimeout( function() { window.scrollTo( 0, 1 ) } );

}( this );