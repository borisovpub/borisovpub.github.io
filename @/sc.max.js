!function( window ) {

	var Date = window.Date;
	var document = window.document;
	var location = window.location;
	var history = window.history;

	var querySelector = document.querySelector.bind( document );
	/** @noinline */
	var setAttribute = function( element, key, value ) { element.setAttribute( key, value || key ) };

	/** @noinline */
	var createScript = function( src ) {
		var script = document.createElement( 'script' );
		setAttribute( script, 'type', 'text/javascript' );
		setAttribute( script, 'async', 'async' );
		setAttribute( script, 'src', src );
		return querySelector( 'head' ).appendChild( script );
	};

	var mode = querySelector( '#mode' );

	var dl = window.dataLayer = [];
	var gtag = window.ga = function() { dl.push( arguments ) };
	var ym = window.ym = function() { ym.a.push( arguments ) };

	ym.a = [];
	ym.l = 1 * new Date();

	gtag( 'js', new Date() );
	gtag( 'config', 'UA-29836360-1' );
	gtag( 'set', { 'user_id': 'USER_ID' } );

	ym( 57548482, 'init', {
		clickmap: true,
		trackLinks: true,
		accurateTrackBounce: true,
		webvisor: true
	} );

	window.yandexChatWidgetCallback = function() { try {
		new window.Ya.ChatWidget( {
			guid: '5b97d160-6cac-43e5-83f4-95a0f44b7f34',
			buttonText: 'Чат с администратором',
			title: 'Чат',
			theme: 'light',
			collapsedDesktop: 'hover',
			collapsedTouch: 'always',
		} );
		[ 'widget', 'button', 'button__container', 'icon' ].forEach( function( key ) {
			var s = 'ya-chat-' + key + '_size_';
			var e = querySelector( '.' + s + 'large' );
			if ( e ) {
				e = e.classList;
				e.remove( s + 'large' );
				e.add( s + 'normal' );
			}
			s = 'ya-chat-' + key + '_mobile';
			e = querySelector( '.' + s );
			if ( e ) e.classList.remove( s );
		} );
	} catch ( e ) {} };

	createScript( '//googletagmanager.com/gtag/js?id=UA-29836360-1' );
	createScript( '//mc.yandex.ru/metrika/tag.js' );
	createScript( '//chat.s3.yandex.net/widget.js' );

	// подменяем историю
	if ( location.search && history ) history.replaceState( null, document.title, location.pathname );

	mode && ( function update() {

		var d = new Date();

		if ( d.getUTCHours() * 60 + d.getUTCMinutes() < 12*60 ) {
			setAttribute( mode, 'class', 'close' );
		} else {
			setAttribute( mode, 'class', 'open' );
		}

		window.setTimeout( update, 60*1e3 );

	} )();

}( this );