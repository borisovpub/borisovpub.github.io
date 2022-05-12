!function( window ) {

	var Date = window.Date;
	var document = window.document;
	var location = window.location;
	var history = window.history;

	/** @noinline */
	var createScript = function( src ) {
		var script = document.createElement( 'script' );
		script.setAttribute( 'type', 'text/javascript' );
		script.setAttribute( 'async', 'async' );
		script.setAttribute( 'src', src );
		return document.querySelector( 'head' ).appendChild( script );
	};

	var dl = window.dataLayer = [];
	var gtag = window.gtag = function() { dl.push( arguments ) };
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

	createScript( '//www.googletagmanager.com/gtag/js?id=UA-29836360-1' );
	createScript( '//mc.yandex.ru/metrika/tag.js' );

	// подменяем историю
	if ( location.search && history ) history.replaceState( null, document.title, location.pathname );

	document.querySelectorAll( '.aside' ).forEach( function( e ) {
		e.addEventListener( 'click', function() {
			document.querySelector( 'aside' ).classList.toggle( 'show' );
		} );
	} );

}( this );