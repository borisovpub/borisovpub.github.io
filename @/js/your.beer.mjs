
/**
 * @typedef { Object } YourBeer
 * @property { number } id
 * @property { string } slug
 * @property { string } name
 * @property { { id: number, name: string }[] } breweries
 * @property { string } logo_image
 * @property { { slug: string, name: string } } beer_style
 * @property { null } gravity
 * @property { number } abv
 * @property { number } ibu
 * @property { number } avg_rating
 * @property { string } date_start
 * @property { boolean } is_checked
 * @property { { price: number, volume: string, packing: string }[] } skus
 * @property { { tap_number: string, start_sales_at: string, shop_price: boolean } } sale_data
 */

/** @type { Promise< Record< string, YourBeer > > } */
const nomenclature = ( async () => {

	let response;
	do {
		response = await globalThis.fetch( 'https://your.beer/api/v1/places/irish-pub' );
	} while ( !response.ok );

	return /** @type { { beers: { tap: YourBeer[], other: YourBeer[] } } } */  response.json();

} )().then( ( { beers: { tap, other } } ) => {

	/** @type { Record< string, YourBeer > } */
	const result = {};

	for ( let beer of tap ) result[ beer.slug ] = beer;
	for ( let beer of other ) result[ beer.slug ] = beer;

	return result;

} );

export default async ( /** string */ slug ) /** Promise< YourBeer > */ =>
	( await nomenclature )[ slug ]
;