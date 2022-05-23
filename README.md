# API Get

![Build Status](https://github.com/janis-commerce/api-get/workflows/Build%20Status/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/api-get/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/api-get?branch=master)
[![npm version](https://badge.fury.io/js/%40janiscommerce%2Fapi-get.svg)](https://www.npmjs.com/package/@janiscommerce/api-get)

A package to handle JANIS Get APIs

## Installation
```sh
npm install @janiscommerce/api-get
```

## Usage
```js
'use strict';

const { ApiGet } = require('@janiscommerce/api-get');

class MyApiGet extends ApiGet {

	get fieldsToSelect() {
		return [
			'id',
			'name',
			'status'
		];
	}

	async format(record) {
		return {
			...record,
			oneMoreField: true
		};
	}

	_parseFilters({ id, ...otherFilters }) {
		return {
			...otherFilters,
			id: Number(id)
		};
	}

	/**
	 * Validates the record getted from DB before format.
	 * @param {Object} The record in DB
	 **/
	async postGetValidate({ name }) {

		if(name === FORBIDDEN_NAME) {
			this.setCode(403);
			throw new Error('Forbidden name');
		}
	}

	/**
	 *  It is to perform extra validations
	 * @returns {void}
	 */
	async postValidate() {
		if(!this.session.hasAccessToAllLocations)
			throw new Error("No access");
	}
}

module.exports = MyApiGet;
```

All methods are optional

# Get APIs with parents

If you have for example, a get API for a sub-entity of one specific record, the parent will be automatically be added as a filter.

For example, the following endpoint: `/api/parent-entity/1/sub-entity/2`, will be a get of the sub-entity, and `parentEntity: '1'` will be set as a filter.

❗# Path ID validation

If ID received by path parameter is invalid, the API will return a 400 error.
This validation will only be performed if the database driver has `idStruct` getter implemented.
This validation is only applied over the main record ID.
Eg: For `/api/parent-entity/1/sub-entity/2` the ID validation will be applied only to `2`
