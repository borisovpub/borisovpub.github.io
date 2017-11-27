!function( /* Window */ window ) {

		/** @type {HTMLDocument} */
		var document = window.document;
		/** @type {Element} */
		var documentElement = document.documentElement;

		var FunctionPrototype = Function.prototype;

		/**
		 * @param {Function} func
		 * @return {Function}
		 */
		var getNativeFunction = function(func) {
			return typeof func == 'function' && /function\s+\w+\(\)\s*\{\s*\[native code]\s*}/.test( Function.prototype.toString.call( func ) ) && func;
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

		/**
		 * @param {string} src
		 * @returns {HTMLIFrameElement}
		 */
		var createIFrame = function(src) {

			var iframe = createElement( 'iframe' );

			setAttribute( iframe, 'src', src );
			setAttribute( iframe, 'allowTransparency', true );
			setAttribute( iframe, 'scrolling', 'no' );

			return iframe;

		};

		/**
		 * @param {string} src
		 * @returns {HTMLScriptElement}
		 */
		var createScript = function(src) {

			var script = createElement( 'script' );

			setAttribute( script, 'type', 'text/javascript' );
			setAttribute( script, 'async', 'async' );
			setAttribute( script, 'src', src );

			return script;

		};

		/**
		 * @param {Element} element
		 * @param {function(Element):void} handle
		 * @returns {void}
		 */
		var createSocialContainer = function(element, handle) {

			addEventListener( element, 'mouseenter', function mouseEnterOnce() {

				removeEventListener( element, 'mouseenter', mouseEnterOnce );

				var timerID;

				var container = appendChild( element, createElement( 'div' ) );

				setAttribute( container, 'class', 'container reset empty' );
				container.getBoundingClientRect();
				setAttribute( container, 'class', 'container empty' );

				addEventListener( element, 'mouseenter', mouseEnter );
				addEventListener( element, 'mouseleave', mouseLeave );

				function mouseEnter() {
					timerID = setTimeout( function() {

						removeEventListener( element, 'mouseenter', mouseEnter );
						removeEventListener( element, 'mouseleave', mouseLeave );

						handle( container );

						var loadTimeout = function() {
							setTimeout( function() {
								setAttribute( container, 'class', 'container' );
							}, 500 );
						};

						var loadIFrame = function() {
							var iframe = queryElementSelector( container, 'iframe' );
							if ( iframe ) onIFrameLoad( iframe, loadTimeout );
							else loadTimeout();
						};

						var loadScript = function() {
							var script = queryElementSelector( container, 'script' );
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

		};

		/**
		 * @param {Element} script
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
		 * @param {Element} iframe
		 * @param {Function} handle
		 * @returns {void}
		 */
		var onIFrameLoad = function(iframe, handle) {

			addEventListener( iframe, 'load', function onload() {
				removeEventListener( iframe, 'load', onload );
				handle();
			} );

		};

		var ga = window.ga = assign( function ga() { ga.q.push( arguments ) }, { q: [], l: 1 * new Date() } );

		var active;

		var main = querySelector( 'main' );

		var bg = querySelector( '#bg img' );

		var vk = querySelector( '#vk' );
		var ok = querySelector( '#ok' );
		var ig = querySelector( '#ig' );
		var fb = querySelector( '#fb' );

		var arr, i, l;

		// vk.com
		vk && createSocialContainer( vk, function(container) {

			var widget = appendChild( container, createElement( 'div' ) );
			var script = appendChild( widget, createScript( '//vk.com/js/api/openapi.js?150' ) );

			setAttribute( widget, 'id', 'vk_widget' );

			onScriptLoad( script, function() {

				window[ 'VK' ][ 'Widgets' ][ 'Group'](
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
		fb && createSocialContainer( fb, function(container) {

			var widget = appendChild( container, createIFrame( '//www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fborisovpub%2F&tabs&width=320&&hide_cta=true' ) );

			setAttribute( widget, 'width', '320' );
			setAttribute( widget, 'height', '214' );

		} );

		// ok.ru
		ok && createSocialContainer( ok, function(container) {

			var widget = appendChild( container, createElement( 'div' ) );
			var script = appendChild( widget, createScript( '//connect.ok.ru/connect.js' ) );

			setAttribute( container, 'id', 'ok_container' );
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
		ig && createSocialContainer( ig, function(container) {

			var widget = appendChild( container, createElement( 'blockquote' ) );
			var anchor = appendChild( widget, createElement( 'a' ) );

			appendChild( widget, createScript( '//platform.instagram.com/ru_RU/embeds.js' ) );

			setAttribute( widget, 'class', 'instagram-media' );
			setAttribute( widget, 'data-instgrm-version', '7' );

			widget.style.width = '320px';

			setAttribute( anchor, 'href', '//www.instagram.com/p/BGFV2KpmwIY/' );

		} );

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
				if ( active && !active.contains( button ) ) setAttribute( active, 'class', '' );
			} );

		}( arr[ i ] ) );

		// deactivate
		addEventListener( documentElement, 'click', function(event) {
			if ( active && !active.contains( event.target ) ) {
				setAttribute( active, 'class', '' );
			}
		} );

		// background resize
		addEventListener( bg, 'load', function onBGLoad() {

			removeEventListener( bg, 'load', onBGLoad );

			var is = bg.style;
			var iw = bg.naturalWidth;
			var ih = bg.naturalHeight;

			/** @returns {void} */
			var updateSize = function() {

				var w = window.innerWidth;
				var s = window.innerHeight / w * iw / ih;

				is.msTransform =
				is.transform =
					w > 799 ? 'scale(' + Math.max( 1, s ) + ')' +
					( s < 1 ? 'translateY(' + ( s - 1 ) * 50 + '%)' : '' )
					: '';

			};

			updateSize();

			window.addEventListener( 'resize', updateSize );

		} );

		// Google Analitics
		createScript( '//www.google-analytics.com/analytics.js' );
		ga( 'create', 'UA-29836360-1', 'auto' );
		ga( 'send', 'pageview' );

	}( window )