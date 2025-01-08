export default async ( /** string */ groupID ) /** Group */ => {

	/**
	 * @typedef { Object } IIKOItem
	 * @property { string } id
	 * @property { string } parentGroup
	 * @property { string } name
	 * @property { string[] } tags
	 */

	/**
	 * @typedef { IIKOItem } IIKOGroup
	 * @property { string } description
	 * @property { number } order
	 * @property { string } additionalInfo
	 * @property { boolean } isGroupModifier
	 */

	/**
	 * @typedef { IIKOItem } IIKOProduct
	 * @property { string } fullNameEnglish
	 * @property { string } description
	 * @property { string[] } imageLinks
	 * @property { number } weight
	 * @property { { price: { isIncludedInMenu: boolean, currentPrice: number } }[] } sizePrices
	 * @property { boolean } isDeleted
	 * @property { { required: boolean, minAmount: number, maxAmount: number, freeOfChargeAmount: number, id: string }[] } groupModifiers
	 * @property { boolean } useBalanceForSell
	 */

	/**
	 * @typedef { Object } RAWGroup
	 * @property { IIKOGroup } [source]
	 * @property { String[] } groupsIDs
	 * @property { IIKOProduct[] } products
	 * @property { Group } [group]
	 */

	/**
	 * @typedef { Object } Item
	 * @property { string } ru название на русском
	 * @property { string } en название на английском
	 * @property { number } order число для сортировки
	 */

	/**
	 * @typedef { Item } Group
	 * @property { Group[] & Record< string, Group > } [groups] дерево дочерних групп
	 * @property { Product[] } [products] дерево пордуктов группы
	 */

	/**
	 * @typedef { Item } Product
	 * @property { string } info всякая доп-инфа
	 * @property { string } desc
	 * @property { string } img
	 * @property { boolean } dynamic динамический вес
	 * @property { { size: number, price: number }[] } units вес и цена продукта
	 * @property { Product[] } [products]
	 */

	// базовый регэксп для переименования
	const re = /^(\s+)?(")?([^(]*)\2$/;

	// функция сортировки по порядку
	const sortOrder = ( a, b ) => a.order - b.order;

	/**
	 * @param { IIKOItem } source
	 * @param { string } tag
	 * @returns { boolean }
	 */
	const hasTag = ( source, tag ) => {
		if ( source.tags ) {
			return source.tags.includes( tag );
		}
	};

	/**
	 * @param { IIKOItem } source
	 * @param { string } tag
	 * @returns { string }
	 */
	const getTagValue = ( source, tag ) => {
		if ( source.tags ) {
			tag += '=';
			const value = source.tags.find( ( value ) => value.startsWith( tag ) );
			if ( value ) return value.slice( tag.length );
		}
	}

	/**
	 * @param { string } id
	 * @returns { RAWGroup }
	 */
	const getSource = ( id ) => /** @type { RAWGroup } */
		nomenclatureMap[ id ] || ( nomenclatureMap[ id ] = {
			products: [],
			groupsIDs: [],
		} )
	;

	/**
	 * @param { string } id
	 * @returns { Group }
	 */
	const computeGroup = ( id ) => {

		let item = nomenclatureMap[ id ];
		let { group, source } = item;
		if ( !group ) {

			// создаём группу
			group = item.group = /** @type { Group } */ {
				ru: source.name,
				en: source.description,
				order: source.order,
				products: [],
				groups: [],
			};

			let ru, en;
			let isGroupModifier = source.isGroupModifier;
			let productMap = {};

			if ( hasTag( source, '-name' ) ) {

				// если указан флаг -name
				// то у группы, надо удалить имя
				group.ru = group.en = '';

			} else if ( hasTag( source, '-subname' ) ) {

				// если указан флаг -subname
				// то удаляем название группы или указанный префикс из дочерних продуктов
				ru = getTagValue( source, '-subname-ru' ) || group.ru;
				ru = new RegExp( `^(${ ru })?\\s*(?:(")?([^(]*)\\2)?$` );

				en = getTagValue( source, '-subname-en' ) || group.en;
				en = en ? new RegExp( `^(${ en })?\\s*(?:(")?([^(]*)\\2)?$` ) : ru;

			} else {

				// иначе просто удаляем возможные ковычки
				ru = en = re;

			}

			// пробегаемся по всем продуктам и создаём
			item.products.forEach( ( source ) => {

				if (

					// если удалён то пропускаем
					source.isDeleted || (

						// не модификатор и насильно не выключён тегом -included
						// проверяем активна ли цена
						!isGroupModifier && !hasTag( source, '-included' ) &&
						!source.sizePrices[ 0 ].price.isIncludedInMenu

					)

				) return;

				let product = productMap[ source.name + '/' + source.additionalInfo ];
				if ( !product ) {

					// если такого продукта нету в карте, значит надо создать
					// иначе это другой вариант того же продукта, и нужно просто обновить свойства

					// создаём продукт
					product = productMap[ source.name + '/' + source.additionalInfo ] = /** @type { Product } */ {
						ru: source.name.replace( ru, '$3' ),
						en: source.fullNameEnglish.replace( en, '$3' ),
						order: source.order,
						dynamic: source.useBalanceForSell,
						info: source.additionalInfo,
						desc: source.description,
						img: source.imageLinks.pop(),
						units: [],
					};

					group.products.push( product );

				}

				// для весового товара может приенять кайфициент
				let dynamic = product.dynamic && parseFloat( getTagValue( source, '-dynamic' ) ) || 1;

				// добавляем варианты
				product.units.push( {
					size: Math.round( source.weight * 1000 * dynamic ), // переводим в граммы
					price: Math.round( source.sizePrices[ 0 ].price.currentPrice * 100 * dynamic ), // переводим в копейки
				} );

				if ( product.units.length > 1 ) {
					product.units.sort( ( a, b ) => a.size - b.size );
				}

				// если стоит тэг -modifiers, или если у блюда много вариантов
				// то игнорируем обработку модификаторов
				if ( !hasTag( source, '-modifiers' ) || product.units.length <= 1 ) {

					// ищем обязательный модификатор, который влияет на вес и цену
					let m = source.groupModifiers.find( ( m ) => m.required );
					if ( m ) {

						if ( hasTag( source, '+modifiers' ) || m.freeOfChargeAmount == m.maxAmount ) {

							// если флаг устновлен, или модификатор полностью бесплатный
							// то склеиваем все значения

							let g = computeGroup( m.id );
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
									u.price += avgPrice * ( m.maxAmount - m.freeOfChargeAmount );
									u.size += avgSize * m.maxAmount;
								} );

							}

						} else if ( m.maxAmount > 1 ) {

							// модификаторов можно добавлять больше 1

							// TODO: пока не поддерживается, игнорируем

						} else {

							// делаем разновидности блюда
							product.products = computeGroup( m.id ).products;

							// TODO: сортировка вариантов?

						}

					}

				}

			} );

			// сортируем, либо удаляем
			if ( group.products.length ) group.products.sort( sortOrder );
			else delete group.products;

			// пробегаемся по дочерним группам и создаём их
			item.groupsIDs.forEach( ( id ) => {

				const child = computeGroup( id );
				// если группа не пустая, то добавляем
				if ( child.groups || child.products ) {

					// если есть английское название, то создаём поле по ключю
					if ( child.en ) group.groups[ ( child.en || '' ).replace( /\W/g, ' ' ).split( /\s+/g ).map( ( s ) => s.charAt( 0 ).toUpperCase() + s.slice( 1 ) ).join( '' ) ] = child;

					group.groups.push( child );

				}

			} );

			// сортируем, либо удаляем
			if ( group.groups.length ) group.groups.sort( sortOrder );
			else delete group.groups;

		}

		return group;

	};

	const nomenclature = /** @type { { groups: IIKOGroup[], products: IIKOProduct[] } } */ await ( await fetch( '/iiko.json' ) ).json();
	const nomenclatureMap = /** @type { Record< string, RAWGroup > } */ {};

	// пробегаемся по всем группам и создаём карту групп
	// у групп все id уникальные, и не повторяются
	nomenclature.groups.forEach( ( source ) => {

		// добавляем ссылку на данные
		getSource( source.id ).source = source;

		// добавляем в родительскую группу
		getSource( source.parentGroup ).groupsIDs.push( source.id );

	} );

	// пробегаемся по продуктам
	// id продуктов могут повторяться, так как один и тот же продукт может находится в разных группах меню
	// нужно их распихивать соответсвенно по группам
	nomenclature.products.forEach( ( source ) => {

		// добавляем продукт в группу
		getSource( source.parentGroup ).products.push( source );

	} );

	// выбираем нужную группу
	return computeGroup( groupID );

};