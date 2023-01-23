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

const FORBIDDEN_NAME = 'Voldemort';

module.exports = class MyApiGet extends ApiGet {

	get fieldsToSelect() {
		return ['name', 'status'];
	}

	get fieldsToExclude() {
		return ['error'];
	}

	get fixedFields() {
		return ['code'];
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
};
```

All methods are optional

## Get APIs with parents

If you have for example, a get API for a sub-entity of one specific record, the parent will be automatically be added as a filter.

For example, the following endpoint: `/api/parent-entity/1/sub-entity/2`, will be a get of the sub-entity, and `parentEntity: '1'` will be set as a filter.

## ApiGet

The following getters and methods can be used to customize and validate your List API.
All of them are optional.

### get modelName()
Returns model name. It is intent to be used to change the model's name and it will not get the model name from endpoint

### get fieldsToSelect()

_Since_ `1.2.0`

This is used to determinate which fields should be selected from the DB.

**Important**: The `id` field is always returned.

If set as `false`. The _parameter_ `fields` will be ignored.

If a field is not found in the document it will be ignored.

### get fieldsToExclude()

_Since_ `4.2.0`

This is used to determinate witch fields must be excluded from the response.

If set as `false`. The _parameter_ `excludeFields` will be ignored.

**Important**: The `id` field is always returned.

If a field is not found in the document it will be ignored.

### get fixedFields()

_Since_ `4.2.0`

This is used to determinate witch fields **should always be returned**.

If a field is not found in the document it will be ignored.

## Reducing responses

_Since_ `4.2.0`

An Api defined with **ApiGet** can be reduced using new parameters `fields` and `excludeFields`.

This parameters will be passed to the **model** for reducing the response on the database-side.

For the following examples we will be using an invented product with the information

```json
{
	"id": 1,
	"code": "t-shirt",
	"name": "Shirt white and blue",
	"price": 200.5,
	"status": "active"
}
```

<details>
	<summary>Example: Reducing response with fields</summary>

When using `fields` we are telling the database the specific fields we wanna receive in the response.

**Important**. When using `fields`, `excludeFields` will be ignored.

```bash
curl --location -g --request GET 'https://my-catalog.com/api/product/1?fields[0]=code&fields[1]=name'

// expected output: { id: 1, code: 't-shirt', name: 'Shirt white and blue' }

```

</details>

<details>
	<summary>Example: Reducing response with excludeFields</summary>

When using `excludeFields` we are telling the database the specific fields we **don't** wanna receive in the response.

**Important**. When using `fields`, `excludeFields` will be ignored.

```bash
curl --location -g --request GET 'https://my-catalog.com/api/product/1?excludeFields[0]=price'

// expected output: { id: 1, code: 't-shirt', name: 'Shirt white and blue', status: 'active' }

```

</details>

### async format(record)
You can use this to format your record before this is returned.

For example, mapping DB friendly values to user friendly values, add default values, translation keys, etc.

### async postValidate()
You can use this to perform extra validations before getting the record.
If it returns a Promise, it will be awaited.

## ✔️ Path ID validation
The `ID` in the `pathParameters` can be validated if the database needs it in order to avoid problems. If this feature is active, the statusCode for this kind of error will be `400`. This validation has a default behavior (Model version 6.3.0 or higher is needed), and can also be customized for specific needs.

### Default behavior
1. The ID will not be validated unless the database driver has `idStruct` method implemented.
2. Validation applies only to main record ID (eg: For `/api/parent-entity/1/sub-entity/2` the ID validation will be applied only to `2`).

### Customization

❗In case you want to set a different behavior or validation, you can do it by overriding the `validateId` method.

**eg: Adding validation for parent `ids`**
```js
	validateId() {

		Object.values(this.parents).forEach(parentId => {
			struct('string&!empty')(parentId)
		});

		struct('objectId')(this.recordId)
	}
```

#### How to disable validation
In case database driver has an `idStruct` defined and you want to disable validation, you can do it by overriding the `validateId` method.

**eg:**
```js
	validateId() {
		// Do nothing
	}
```
