'use strict';

/**
 * @typedef CodesError
 * @property {Number} INVALID_REQUEST_DATA
 * @property {Number} INVALID_ENTITY
 * @property {Number} INTERNAL_ERROR
 */

/**
 * @class ApiGetError
 * @extends Error
 * @classdesc It is used for error handling of the ApiGet class
 */

module.exports = class ApiGetError extends Error {

	/**
	 * Get the error codes
	 * @returns {CodesError}
	 */
	static get codes() {

		return {
			INVALID_REQUEST_DATA: 1,
			INVALID_ENTITY: 2,
			INTERNAL_ERROR: 99
		};
	}

	/**
	 * @param {Object|string} err The details of the error
	 * @param {Number} code The error code
	 */
	constructor(err, code) {

		const message = err.message || err;

		super(message);
		this.message = message;
		this.code = code;
		this.name = 'ApiGetError';

		if(err instanceof Error)
			this.previousError = err;
	}
};
