# API Get

[![Build Status](https://travis-ci.org/janis-commerce/api-get.svg?branch=master)](https://travis-ci.org/janis-commerce/api-get)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/api-get/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/api-get?branch=master)

A package to handle JANIS Get APIs

## Installation
```sh
npm install @janiscommerce/api-get
```

## ⚠️ **Breaking changes from version *3.0.0*** ⚠️
*Since 3.0.0*

API upgraded to v5. API Session store validations replaced with loactions

For more information see [API](https://www.npmjs.com/package/@janiscommerce/api) and [API Session](https://www.npmjs.com/package/@janiscommerce/api-session)

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

}

module.exports = MyApiGet;
```

All methods are optional

# Get APIs with parents

If you have for example, a get API for a sub-entity of one specific record, the parent will be automatically be added as a filter.

For example, the following endpoint: `/api/parent-entity/1/sub-entity/2`, will be a get of the sub-entity, and `parentEntity: '1'` will be set as a filter.
