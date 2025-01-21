( function ( window ) {

	var Array = window.Array;
	var Date = window.Date;
	var document = window.document;
	var location = window.location;
	var history = window.history;
	var Math = window.Math;

	var fetch = window.fetch;
	var parseInt = window.parseInt;

	var body = document.querySelector( 'body' );
	var backToTop = document.querySelector( '.back-to-top' );
	var popup = document.querySelector( '.popup' );

	/**
	 * @param { number } time
	 * @returns { Promise< void > }
	 */
	var timeout = async ( time ) => await new window.Promise( ( resolve ) => window.setTimeout( resolve, time ) );

	/** @noinline */
	var createScript = ( src ) => {
		var script = document.createElement( 'script' );
		script.setAttribute( 'type', 'text/javascript' );
		script.setAttribute( 'async', 'async' );
		script.setAttribute( 'src', src );
		return document.querySelector( 'head' ).appendChild( script );
	};

	/**
	 * @param { string } htm
	 * @returns { Promise< HTMLElement > }
	 */
	var openPopup = async ( htm ) => {
		popup.innerHTML = await ( await fetch( `/ru/_/${ htm }.htm` ) ).text();
		popup.querySelectorAll( '.close' ).forEach( ( close ) =>
			close.addEventListener( 'click', closePopup )
		);
		await timeout( 15 );
		body.classList.add( 'popuped' );
		return popup;
	};

	/**
	 * @returns { Promise< void > }
	 */
	var closePopup = async () => {
		body.classList.remove( 'popuped' );
		await timeout( 150 );
		document.querySelector( '.popup' ).innerHTML = '';
	};

	/**
	 * @returns { Promise< { schedule: { open: string, close: string }[], times: { day: number, status: boolean }[] } >}
	 */
	var fetchSchedule = async () => {

		var p = fetch( '/organization.ld.json' )
			.then( ( response ) => response.json() )
			.then( ( { openingHoursSpecification } ) => {

				var UTC = Math.round( ( new Date() ).getTimezoneOffset() / 30 );
				var L = 7 * 48;

				var schedule = [];
				var r, times = new Array( L );
				var d, days = 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'.split( ',' );

				for ( d = 0; d < 7; ++d ) {
					times.fill( { day: d, status: false }, d * 48, ( d + 1 ) * 48 );
				}

				for ( let { dayOfWeek, opens, closes } of openingHoursSpecification ) {

					opens = opens.split( ':' );
					closes = closes.split( ':' );

					let ot = opens[ 0 ] + ':' + opens[ 1 ];
					let ct = closes[ 0 ] + ':' + closes[ 1 ];

					opens = opens.map( ( t ) => parseInt( t ) );
					closes = closes.map( ( t ) => parseInt( t ) );

					opens = opens[ 0 ] * 2 + Math.round( opens[ 1 ] / 30 ) + UTC;
					closes = closes[ 0 ] * 2 + Math.round( closes[ 1 ] / 30 ) + UTC;

					if ( closes < opens ) closes += 48;

					for ( d of window.Array.isArray( dayOfWeek ) ? dayOfWeek : [ dayOfWeek ] ) {

						d = days.indexOf( d );
						r = { day: d, status: true };

						schedule[ d ] = { open: ot, close: ct };

						let o = d * 48 + opens;
						let c = d * 48 + closes;

						for ( ; o<0; ++o ) times[ o + L ] = r;
						for ( ; o<c; ++o ) times[ o % L ] = r;

					}

				}

				return ( fetchSchedule = async () => ( { schedule, times } ) )();

			} )
		;

		return ( fetchSchedule = async () => await p )();

	};

	/**
	 * @param { Date } date
	 * @returns { Promise< { day: number, status: boolean } > }
	 */
	var getScheduleStatus = async ( date = new Date() ) =>
		( await fetchSchedule() ).times[
			date.getDay() * 48 + date.getUTCHours() * 2 + Math.floor( date.getUTCMinutes() / 30 )
		]
	;

	/**
	 * @param { number } day
	 * @returns { Promise< { open: string, close: string } > }
	 */
	var getSchedule = async ( day ) =>
		( await fetchSchedule() ).schedule[ day ]
	;

	/** @noinline */
	var gid = 'G-3JBY3WBW1R';

	var dl = window.dataLayer = [];
	var gtag = window.gtag = function() { dl.push( arguments ) };
	var ym = window.ym = function() { ym.a.push( arguments ) };

	ym.a = [];
	ym.l = 1 * new Date();

	gtag( 'js', new Date() );
	gtag( 'config', gid );

	ym( 57548482, 'init', {
		clickmap: true,
		trackLinks: true,
		accurateTrackBounce: true,
		webvisor: true
	} );

	// createScript( '//www.googletagmanager.com/gtag/js?id=' + gid );
	// createScript( '//mc.yandex.ru/metrika/tag.js' );

	// подменяем историю
	if ( location.search && history ) history.replaceState( null, document.title, location.pathname );

	if ( backToTop ) {

		var isVisible = false;

		var scroll = () => {
			if ( ( isVisible = window.scrollY > 10 ) ) {
				backToTop.classList.add( 'visible' );
			} else {
				backToTop.classList.remove( 'visible' )
			}
		};

		backToTop.addEventListener( 'click', () => {
			if ( window.navigator.vendor.indexOf( 'Apple' ) !== -1 ) {
				window.parent.scrollTo( 0, body.getBoundingClientRect().top );
			} else {
				body.scrollIntoView( { behavior: 'smooth' } );
			}
		} );

		window.addEventListener( 'scroll', scroll );

		scroll();

	}

	popup.addEventListener( 'click', async ( event ) => {
		var modal = popup.querySelector( '.modal' );
		if ( modal && !modal.contains( event.target ) ) {
			await closePopup();
		}
	} );

	document.querySelectorAll( '.worktime' ).forEach( ( worktime ) => {

		worktime.addEventListener( 'click', async () => {

			let popup = await openPopup( 'worktime' );

			for ( let day = 0; day < 7; ++day ) {
				let { open, close } = await getSchedule( day );
				let d = popup.querySelector( '.day.d-' + day );
				d.querySelector( '.d-open' ).textContent = open;
				d.querySelector( '.d-close' ).textContent = close;
			}

			let today = await getScheduleStatus();
			let day = popup.querySelector( '.day.d-' + today.day );

			day.classList.add( 'd-today' );
			if ( !today.status ) day.classList.add( 'd-closed' );

		} );

		worktime.update = async () => {
			worktime.classList.add( 'loading' );
			let { open, close } = await getSchedule( ( await getScheduleStatus() ).day );
			worktime.textContent = open + '-' + close;
			worktime.classList.remove( 'loading' );
		};

		worktime.update().then( () => {} );

		window.setInterval( worktime.update, 1e3 * 60 );

	} );

	document.querySelectorAll( '.info' ).forEach( ( info ) => {

		info.addEventListener( 'click', async () => {

			let popup = await openPopup( 'info' );

			let d, open, close;

			for ( let day = 0; day < 7; ++day ) {
				( { open, close } = await getSchedule( day ) );
				d = popup.querySelector( '.day.d-' + day );
				d.querySelector( '.d-open' ).textContent = open;
				d.querySelector( '.d-close' ).textContent = close;
			}

			( { open, close } = await getSchedule( ( await getScheduleStatus() ).day ) );
			d = popup.querySelector( '.day.today' );
			d.querySelector( '.d-open' ).textContent = open;
			d.querySelector( '.d-close' ).textContent = close;

			popup.querySelector( 'a.day' ).addEventListener( 'click', ( event ) => {
				event.currentTarget.classList.toggle( 'click' );
			} );

		} );

	} );

	document.querySelectorAll( '.menu' ).forEach( ( menu ) => {

		menu.addEventListener( 'click', async () => {

			let popup = await openPopup( 'menu' );


		} );

	} );

} )( this );