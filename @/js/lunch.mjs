export default async () => {

	const Date = globalThis.Date;

	let response;

	do {
		response = await globalThis.fetch( '/lunch/data.json?' + globalThis.Math.random() );
	} while ( !response.ok );

	/** @typedef { [ string, number, number ] } LunchDish */

	/** @typedef { [ string, ...LunchDish ] } LunchGroup */

	/** @type { { mode: 0 | 1 | 2, lunch: LunchGroup[], date: Date } } */
	let data = await response.json();

	let q = new Date( response.headers.get( 'Last-Modified' ) );
	let d = new Date();
	if ( d.getUTCDate() == q.getUTCDate() && q.getUTCHours() >= 16 - 3 ) {
		d = new Date( q.getTime() + 24 * 60 * 60 * 1000 );
	}

	data.date = d;

	return data;

};