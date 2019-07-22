'use strict';

const assert = require('assert');

const EndpointParser = require('../lib/helpers/endpoint-parser');
const { ApiGetError } = require('../lib');

const fixture = require('./endpoint-parser-fixtures');

describe('EndpointParser', () => {

	describe('Parse', () => {

		for(const testCase of fixture) {

			const {
				description,
				endpoint,
				error,
				result
			} = testCase;

			it(description, () => {

				if(error)
					assert.throws(() => EndpointParser.parse(endpoint), ApiGetError);
				else
					assert.deepStrictEqual(EndpointParser.parse(endpoint), result);
			});

		}

	});

});
