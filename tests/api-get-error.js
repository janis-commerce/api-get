'use strict';

const assert = require('assert');

const { ApiGetError } = require('../lib');

describe('Api Get Error', () => {

	it('Should accept a message error and a code', () => {
		const error = new ApiGetError('Some error', ApiGetError.codes.INVALID_REQUEST_DATA);

		assert.strictEqual(error.message, 'Some error');
		assert.strictEqual(error.code, ApiGetError.codes.INVALID_REQUEST_DATA);
		assert.strictEqual(error.name, 'ApiGetError');
	});

	it('Should accept an error instance and a code', () => {

		const previousError = new Error('Some error');

		const error = new ApiGetError(previousError, ApiGetError.codes.INVALID_REQUEST_DATA);

		assert.strictEqual(error.message, 'Some error');
		assert.strictEqual(error.code, ApiGetError.codes.INVALID_REQUEST_DATA);
		assert.strictEqual(error.name, 'ApiGetError');
		assert.strictEqual(error.previousError, previousError);
	});
});
