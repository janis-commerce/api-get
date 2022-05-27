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

# ✔️ Path ID validation

## Default behavior
1. If received ID is invalid, the API will return a ***400*** error. 
2. Only the main record id will be validated (eg: For `/api/parent-entity/1/sub-entity/2` the ID validation will be applied only to `2`).
3. This validation will only be performed if the database driver has `idStruct` getter implemented.

❗In case you want to set a different behaviour or validation, you can do it by overriding the `validateId` method.

**eg: Adding validation for parent `ids`**
```javascript
	validateId() {

		Object.values(this.parents).forEach(parentId => {
			struct('string&!empty')(parentId)
		});

		struct('objectId')(this.recordId)
	}
```
## How to disable validation
In case you want to disable the validation, you can do it also by overriding the `validateId` method.

**eg:**
```javascript
	validateId() {
		// Do nothing
	}
```
