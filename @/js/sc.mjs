
	const Array =		globalThis.Array;
	const Date =		globalThis.Date;
	const Promise =		globalThis.Promise;
	const Math =		globalThis.Math;

	const document =	globalThis.document;
	const location =	globalThis.location;
	const history =		globalThis.history;

	const fetch =		globalThis.fetch;
	const parseInt =	globalThis.parseInt;

	const body =		document.querySelector( 'body' );
	const backToTop =	document.querySelector( '.back-to-top' );
	const popup =		document.querySelector( '.popup' );

	/**
	 * @param { number } time
	 * @returns { Promise< void > }
	 */
	const timeout = async ( time ) => new Promise( ( resolve ) => globalThis.setTimeout( resolve, time ) );

	/** @noinline */
	const createScript = ( src ) => {
		const script = document.createElement( 'script' );
		script.setAttribute( 'type', 'text/javascript' );
		script.setAttribute( 'async', 'async' );
		script.setAttribute( 'src', src );
		return document.querySelector( 'head' ).appendChild( script );
	};

	/**
	 * @param { string } htm
	 * @returns { Promise< HTMLElement > }
	 */
	const openPopup = async ( htm ) => {
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
	const closePopup = async () => {
		body.classList.remove( 'popuped' );
		await timeout( 150 );
		document.querySelector( '.popup' ).innerHTML = '';
	};

	/**
	 * @param { * } v
	 * @returns { string }
	 */
	const pad2 = ( v ) => {
		v = Math.round( v ).toString();
		return ( v.length < 2 ? '0' : '' ) + v;
	};

	/**
	 * @param { number } time
	 * @returns { string }
	 */
	const toTime = ( time ) => pad2( time >> 0 ) + ':' + pad2( ( time % 1 ) * 60 );

	/**
	 * @typedef { {
	 *     address: string,
	 *     email: string,
	 *     telephone: string,
	 *     social: string[],
	 *     hours: [ number, number ][],
	 *     getStatus: () => { day: number, status: boolean },
	 * } } Organization
	 */

	/**
	 * @typedef { Organization[] & {
	 *     getSchedule: function( number= ): [ number, number ],
	 *     getStatus: () => { day: number, status: boolean },
	 * } } Organizations
	 */

	/**
	 * @returns { Promise< Organizations > }
	 */
	let fetchOrganizations = async () => {

		const DAYS = 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'.split( ',' );

		const getValue  = ( value ) => Array.isArray( value ) ? value[ 0 ] : value;

		const p = /** @type { Promise< Organizations > } */ new Promise( async ( resolve ) => {

			const result = /** @type { Organizations }*/ [];

			for ( let link of document.querySelectorAll( 'link[rel="alternate"][type="application/ld+json"]' ) ) {

				let schema = await ( await fetch( link.getAttribute( 'href' ) ) ).json();

				let hours = [];

				// noinspection JSUnresolvedReference
				for ( let { dayOfWeek = DAYS, opens, closes } of Array.isArray( schema.openingHoursSpecification ) ? schema.openingHoursSpecification : [ schema.openingHoursSpecification ] ) {

					opens = opens.split( ':' );
					closes = closes.split( ':' );

					opens = parseInt( opens[ 0 ] ) + parseInt( opens[ 1 ] ) / 60;
					closes = parseInt( closes[ 0 ] ) + parseInt( closes[ 1 ] ) / 60;

					for ( let day of Array.isArray( dayOfWeek ) ? dayOfWeek : [ dayOfWeek ] ) {
						hours[ DAYS.indexOf( day ) ] = [ opens, closes ];
					}

				}

				// noinspection JSUnresolvedReference
				result.push( /** @type { Organization } */ {

					address:	schema.address.streetAddress.find( ( a ) => a[ '@language' ] == 'ru' )[ '@value' ],
					email:		getValue( schema.contactPoint.email ),
					telephone:	getValue( schema.contactPoint.telephone ),
					social:		schema.contactPoint.sameAs || [],
					hours:		hours,

					getStatus( date = new Date() ) {

						const L = 7 * 48;

						const times = new Array( L );

						for ( let d = 0; d < 7; ++d ) {
							times.fill( { day: d, status: false }, d * 48, ( d + 1 ) * 48 );
						}

						for ( let d = 0; d < 7; ++d ) {

							let r = { day: d, status: true };

							let t = this.hours[ d ];
							let o = d * 48 + Math.round( t[ 0 ] * 2 );
							let c = d * 48 + Math.round( t[ 1 ] * 2 );

							if ( c < o ) c += 48;

							for ( ; o<0; ++o ) times[ o + L ] = r;
							for ( ; o<c; ++o ) times[ o % L ] = r;

						}

						return ( this.getStatus = ( date = new Date() ) => times[
							date.getDay() * 48 + date.getHours() * 2 + Math.floor( date.getMinutes() / 30 )
						] )( date );

					},

				} );

			}

			result.getSchedule = ( day = ( new Date() ).getDay() ) => {

				let o = Number.POSITIVE_INFINITY;
				let c = Number.NEGATIVE_INFINITY;
				for ( let f of result ) {
					let t = f.hours[ day ];
					o = Math.min( o, t[ 0 ] );
					c = Math.max( o, ( t[ 1 ] < o ? 24 : 0 ) + t[ 1 ] );
				}
				if ( c >= 24 ) c -= 24;

				return [ o, c ];

			};

			result.getStatus = ( date = new Date() ) => {

				let s;
				for ( let f of result ) {
					// noinspection JSCheckFunctionSignatures
					s = f.getStatus( date );
					if ( s.status ) break;
				}
				return s;

			};

			resolve( result );

		} );

		return ( fetchOrganizations = async () => p )();

	};

	let dl = globalThis.dataLayer = [];
	let gtag = globalThis.gtag = function() { dl.push( arguments ) };
	let ym = globalThis.ym = function() { ym.a.push( arguments ) };

	ym.a = [];
	ym.l = 1 * new Date();

	gtag( 'js', new Date() );
	gtag( 'config', 'G-3JBY3WBW1R' );

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

		let isVisible = false;

		let scroll = () => {
			if ( ( isVisible = globalThis.scrollY > 10 ) ) {
				backToTop.classList.add( 'visible' );
			} else {
				backToTop.classList.remove( 'visible' )
			}
		};

		backToTop.addEventListener( 'click', () => {
			// noinspection JSDeprecatedSymbols
			if ( globalThis.navigator.vendor.indexOf( 'Apple' ) !== -1 ) {
				globalThis.parent.scrollTo( 0, body.getBoundingClientRect().top );
			} else {
				body.scrollIntoView( { behavior: 'smooth' } );
			}
		} );

		globalThis.addEventListener( 'scroll', scroll );

		scroll();

	}

	popup.addEventListener( 'click', async ( event ) => {
		let modal = popup.querySelector( '.modal' );
		if ( modal && !modal.contains( event.target ) ) {
			await closePopup();
		}
	} );

	document.querySelectorAll( '.worktime' ).forEach( ( worktime ) => {

		worktime.update = async () => {
			worktime.classList.add( 'loading' );
			let [ o, c ] = ( await fetchOrganizations() ).getSchedule();
			worktime.textContent = toTime( o ) + '-' + toTime( c );
			worktime.classList.remove( 'loading' );
		};

		worktime.update().then( () => {} );

		globalThis.setInterval( worktime.update, 1e3 * 60 );

		if ( !worktime.classList.contains( 'info' ) ) {

			worktime.addEventListener( 'click', async ( event ) => {

				event.preventDefault();

				let popup = await openPopup( 'worktime' );
				let organizations = await fetchOrganizations();

				for ( let day = 0; day < 7; ++day ) {
					let [ o, c ] = organizations.getSchedule( day );
					popup.querySelector( `.day.d-${ day } .d-open` ).textContent = toTime( o );
					popup.querySelector( `.day.d-${ day } .d-close` ).textContent = toTime( c );
				}

				let today = organizations.getStatus();
				let day = popup.querySelector( '.day.d-' + today.day );

				day.classList.add( 'd-today' );
				if ( !today.status ) day.classList.add( 'd-closed' );

			} );

		}

	} );

	document.querySelectorAll( '.info' ).forEach( ( info ) => {

		info.addEventListener( 'click', async ( event ) => {

			event.preventDefault();

			let popup = await openPopup( 'info' );
			let ul = popup.querySelector( 'ul' );
			let organizationTemplate = ul.querySelector( 'ul template' );

			for ( let f of await fetchOrganizations() ) {

				let t;

				let organization = organizationTemplate.content.cloneNode( true );
				let contacts = organization.querySelector( '.contacts' );

				if ( f.telephone ) {
					let a = document.createElement( 'a' );
					a.setAttribute( 'href', 'tel:' + f.telephone );
					a.textContent = f.telephone.replace( /^\+(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})$/, '+$1 ($2) $3-$4-$5' );
					contacts.appendChild( a );
				}

				for ( let s of f.social ) {
					let a = document.createElement( 'a' );
					a.setAttribute( 'href', s );
					a.setAttribute( 'rel', 'nofollow' );
					a.setAttribute( 'target', '_blank' );
					a.classList.add( 'social' );
					contacts.appendChild( a );
				}

				organization.querySelector( '.address' ).textContent = f.address;

				for ( let day = 0; day < 7; ++day ) {

					t = f.hours[ day ];

					organization.querySelector( `.day.d-${ day } .d-open` ).textContent = toTime( t[ 0 ] );
					organization.querySelector( `.day.d-${ day } .d-close` ).textContent = toTime( t[ 1 ] );

				}

				t = f.hours[ f.getStatus().day ];

				organization.querySelector( '.day.today .d-open' ).textContent = toTime( t[ 0 ] );
				organization.querySelector( '.day.today .d-close' ).textContent = toTime( t[ 1 ] );

				organization.querySelector( '.day.today' ).addEventListener( 'click', ( event ) => {
					popup.querySelectorAll( '.day.click' ).forEach( ( day ) => day.classList.remove( 'click' ) );
					event.currentTarget.classList.add( 'click' );
				} );

				ul.appendChild( organization );

			}

		} );

	} );

	document.querySelectorAll( '.menu' ).forEach( ( menu ) => {

		menu.addEventListener( 'click', () => openPopup( 'menu' ) );

	} );

	export {
		timeout,
		openPopup,
		closePopup,
		fetchOrganizations,
	};
