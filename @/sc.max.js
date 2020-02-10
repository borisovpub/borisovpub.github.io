!function( window ) {

	var Date = window.Date;
	var document = window.document;
	var location = window.location;
	var history = window.history;

	var querySelector = document.querySelector.bind( document );
	var setAttribute = function( element, key, value ) { element.setAttribute( key, value || key ) };

	var createScript = function( src ) {

		var script = document.createElement( 'script' );

		setAttribute( script, 'type', 'text/javascript' );
		setAttribute( script, 'async', 'async' );
		setAttribute( script, 'src', src );

		return querySelector( 'head' ).appendChild( script );

	};

	var mode = querySelector( '#mode' );

	var ga = window[ 'ga' ] = function ga() { ga[ 'q' ].push( arguments ) };

	ga[ 'q' ] = [];
	ga[ 'l' ] = 1 * new Date();

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

	// Google Analitics
	createScript( '//www.google-analytics.com/analytics.js' );
	ga( 'create', 'UA-29836360-1', 'auto' );
	ga( 'require', 'GTM-MDJMFT6' );
	ga( 'send', 'pageview' );

}( this )