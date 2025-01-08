export default async () /** Promise< Record< string, YourBeer >> */ => {

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

	const nomenclature =
		/** @type { { beers: { tap: Array< YourBeer >, other: Array< YourBeer > } } } */
		await ( await fetch( 'https://your.beer/api/v1/places/irish-pub' ) ).json()
	;

	const result = /** @type { Record< string, YourBeer > } */ {};

	for ( let beer of nomenclature.beers.tap ) {
		result[ beer.slug ] = beer;
	}

	for ( let beer of nomenclature.beers.other ) {
		result[ beer.slug ] = beer;
	}

	return result;

};