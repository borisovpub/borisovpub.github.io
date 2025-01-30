export default async ( /** string */ groupID ) /** Promise< Group > */ => {

	const RegExp =	globalThis.RegExp;

	const Math =	globalThis.Math;

	/**
	 * @typedef { Object } APIObject
	 * @property { string } ru
	 * @property { string } en
	 * @property { Record< string, string > } flags
	 * @property { string } info
	 */

	/**
	 * @typedef { APIObject } APIGroup
	 * @property { APIProduct[] } products
	 * @property { APIGroup[] } groups
	 */

	/**
	 * @typedef { APIGroup } APIModifier
	 * @property { number } freeAmount
	 * @property { number } maxAmount
	 */

	/**
	 * @typedef { APIObject } APIProduct
	 * @property { boolean } dynamic
	 * @property { string } desc
	 * @property { string } img
	 * @property { number } size
	 * @property { number } price
	 * @property { APIModifier } modifier
	 */

	/**
	 * @typedef { Object } ItemText
	 * @property { string } ru текст на русском
	 * @property { string } [en] текст на английском
	 */

	/**
	 * @typedef { Object } Item
	 * @property { ItemText } name название
	 * @property { string } [info] всякая доп-инфа
	 */

	/** @typedef { "dish" | "drink" | "wine" | "beer" } GroupType */

	/**
	 * @typedef { Item } Group
	 * @property { GroupType } [type]
	 * @property { number } [colon]
	 * @property { boolean } [mini]
	 * @property { boolean } [noSite=false]
	 * @property { Product[] } [products] дерево пордуктов группы
	 * @property { GroupCollection } [groups] дерево дочерних группf
	 */

	/** @typedef { Group[] & Record< string, Group > } GroupCollection */

	/**
	 * @typedef { Item } Product
	 * @property { ItemText } [desc]
	 * @property { string } [img]
	 * @property { boolean } dynamic динамический вес
	 * @property { { size: number, price: number }[] } units вес и цена продукта
	 * @property { Product[] } [modifiers]
	 */

	/**
	 * @param { APIGroup } source
	 * @param { boolean } include
	 * @returns { Group }
	 */
	const computeGroup = ( source, include = false ) => {

		let group = /** @type { Group } */ {
			name: {
				ru: source.ru,
				en: source.en,
			},
			info: source.info,
			products: [],
			groups: [],
		};

		let ru, en;

		if ( '-site' in source.flags ) group.noSite = true;
		if ( '-group' in source.flags )	group.type = source.flags[ '-group' ] || '';
		if ( '-colon' in source.flags )	group.colon = parseInt( source.flags[ '-colon' ] ) || 0;
		if ( '-mini' in source.flags )	group.mini = true;

		if ( '-subname' in source.flags ) {

			// если указан флаг -subname
			// то удаляем название группы или указанный префикс из дочерних продуктов
			ru = source.flags[ '-subname-ru' ] || source.ru;
			ru = new RegExp( `^(${ ru })?\\s*(?:(")?([^(]*)\\2)?$` );

			en = source.flags[ '-subname-en' ] || source.en;
			en = en ? new RegExp( `^(${ en })?\\s*(?:(")?([^(]*)\\2)?$` ) : ru;

		} else {

			// иначе просто удаляем возможные ковычки
			ru = en = /^(\s+)?(")?([^(]*)\2$/;

		}

		if ( '-name' in source.flags ) {

			// если указан флаг -name
			// то у группы, надо удалить имя
			group.name.ru = group.name.en = '';

		}

		// пробегаемся по всем продуктам и создаём
		source.products.forEach( ( source ) => {

				// создаём продукт
			let product = /** @type { Product } */ {
				name: {
					ru: source.ru.replace( ru, '$3' ),
					en: source.en.replace( en, '$3' ),
				},
				info: source.info,
				dynamic: source.dynamic,
				units: [],
			};

			let m = source.modifier;

			// для весового товара может приенять кайфициент
			let dynamic = product.dynamic && globalThis.parseFloat( source.flags[ '-dynamic' ] ) || 1;

			// вычисляем цену и размер
			let size = Math.round( source.size * dynamic );
			let price = Math.round( source.price * dynamic );

			if ( source.desc ) product.desc = { ru: source.desc };
			if ( source.img ) product.img = source.img;

			// если стоит тэг -modifiers, или если у блюда много вариантов
			// то игнорируем обработку модификаторов
			if ( m && !( '-modifiers' in source.flags ) ) {

				let modifiers = computeGroup( m, true ).products;

				if ( '+modifiers' in source.flags ) {

					// если флаг устновлен, или модификатор полностью бесплатный
					// значит склеиваем все значения

					let avgPrice = 0;
					let avgSize = 0;

					modifiers.forEach( ( { units: [ { price, size } ] } ) => {
						avgPrice += price;
						avgSize += size;
					} );

					avgPrice = Math.round( avgPrice / modifiers.length );
					avgSize = Math.round( avgSize / modifiers.length );

					// просто добавляем средний вес из модификаторов к основному блюду
					price += avgPrice * ( m.maxAmount - m.freeAmount );
					size += avgSize * m.maxAmount;

				} else {

					// делаем разновидности блюда
					// переносим вес и цену из основного блюда в модификаторы

					modifiers.forEach( ( { units } ) => units.forEach( ( u ) => {
						u.price += price;
						u.size += size;
					} ) );

					product.modifiers = modifiers;

				}

			}

			// добавляем вариант, если не чикнули
			if ( price || size ) {
				product.units.push( { size, price } );
			}

			group.products.push( product );

		} );

		// удаляем если пусто
		if ( !group.products.length ) delete group.products;
		else {

			let productMap = {};

			group.products = group.products.filter( ( product ) => {

				let key = product.name.ru + '/' + product.info;

				if ( key in productMap ) {
					productMap[ key ].units.push( ... product.units );
					productMap[ key ].units.sort( ( a, b ) => a.size - b.size );
				} else {
					productMap[ key ] = product;
					return true;
				}

			} );

		}

		source.groups.forEach( ( source ) => {

			const child = computeGroup( source );
			// если группа не пустая, то добавляем
			if ( child.groups || child.products ) {

				// если есть английское название, то создаём поле по ключю
				if ( child.name.en ) group.groups[
					( child.name.en || '' )
						.replace( /\W/g, ' ' )
						.split( /\s+/g )
						.map( ( s ) => s.charAt( 0 ).toUpperCase() + s.slice( 1 ) )
						.join( '' )
					] = child;

				group.groups.push( child );

			}
		} );

		// удаляем если пусто
		if ( !group.groups.length ) delete group.groups;

		return group;

	};

	let response;
	do {
		// response = await globalThis.fetch( `http://borisovpub.42web.io/iiko/${ groupID }.json` );
		response = await globalThis.fetch( `https://irish-pub-by.tiiny.io/?${ groupID }.json` );
	} while ( !response.ok );

	return computeGroup( await response.json() );

};