'use strict';

class ApiGetError extends Error {

	static get codes() {

		return {
			INVALID_REQUEST_DATA: 1,
			INVALID_ENTITY: 2,
			INTERNAL_ERROR: 99
		};

	}

	constructor(err, code) {
		super(err);
		this.message = err.message || err;
		this.code = code;
		this.name = 'ApiGetError';
	}
}

module.exports = ApiGetError;
