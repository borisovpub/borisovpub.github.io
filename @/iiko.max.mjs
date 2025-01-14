export default async ( /** string */ groupID ) /** Group */ => {

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
	 * @property { boolean } isIncluded
	 * @property { APIModifier } modifier
	 */

	/**
	 * @typedef { Object } Item
	 * @property { string } ru название на русском
	 * @property { string } en название на английском
	 * @property { string } info всякая доп-инфа
	 */

	/**
	 * @typedef { Item } Group
	 * @property { Product[] } [products] дерево пордуктов группы
	 * @property { Group[] & Record< string, Group > } [groups] дерево дочерних групп
	 */

	/**
	 * @typedef { Item } Product
	 * @property { string } [desc]
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
			ru: source.ru,
			en: source.en,
			products: [],
			groups: [],
		};

		let ru, en;

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
			group.ru = group.en = '';

		}

		// пробегаемся по всем продуктам и создаём
		source.products.forEach( ( source ) => {

			if ( !source.isIncluded && !( include || '-included' in source.flags ) ) return;

				// создаём продукт
			let product = /** @type { Product } */ {
				ru: source.ru.replace( ru, '$3' ),
				en: source.en.replace( en, '$3' ),
				dynamic: source.dynamic,
				info: source.info,
				units: [],
			};

			let m = source.modifier;

			// для весового товара может приенять кайфициент
			let dynamic = product.dynamic && parseFloat( source.flags[ '-dynamic' ] ) || 1;

			// добавляем варианты
			product.units.push( {
				size: Math.round( source.size * dynamic ),
				price: Math.round( source.price * dynamic ),
			} );

			if ( source.desc ) product.desc = source.desc;
			if ( source.img ) product.img = source.img;

			// если стоит тэг -modifiers, или если у блюда много вариантов
			// то игнорируем обработку модификаторов
			if ( m && !( '-modifiers' in source.flags ) ) {

				if ( '+modifiers' in source.flags || m.freeAmount == m.maxAmount ) {

					// если флаг устновлен, или модификатор полностью бесплатный
					// то склеиваем все значения

					let g = computeGroup( m );
					if ( g.products ) {

						let avgPrice = 0;
						let avgSize = 0;

						g.products.forEach( ( p ) => {

							let { price, size } = p.units[ 0 ];

							avgPrice += price;
							avgSize += size;

						} );

						avgPrice = Math.round( avgPrice / g.products.length );
						avgSize = Math.round( avgPrice / g.products.length );

						// просто добавляем средний вес из модификаторов к основному блюду
						product.units.forEach( ( u ) => {
							u.price += avgPrice * ( m.maxAmount - m.freeAmount );
							u.size += avgSize * m.maxAmount;
						} );

					}

				} else if ( source.modifier.maxAmount > 1 ) {

					// модификаторов можно добавлять больше 1

					// TODO: пока не поддерживается, игнорируем

				} else {

					// делаем разновидности блюда
					product.modifiers = computeGroup( source.modifier, true ).products;

				}

			}

			group.products.push( product );

		} );

		// удаляем если пусто
		if ( !group.products.length ) delete group.products;
		else {

			let productMap = {};

			group.products = group.products.filter( ( product ) => {

				let key = product.ru + '/' + product.info;

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
				if ( child.en ) group.groups[ ( child.en || '' ).replace( /\W/g, ' ' ).split( /\s+/g ).map( ( s ) => s.charAt( 0 ).toUpperCase() + s.slice( 1 ) ).join( '' ) ] = child;

				group.groups.push( child );

			}
		} );

		// удаляем если пусто
		if ( !group.groups.length ) delete group.groups;

		return group;

	};

	let response;
	do {
		response = await fetch( `https://irish-pub-by.tiiny.io/?${ groupID }.json` );
	} while ( !response.ok );

	return computeGroup( await response.json() );

};