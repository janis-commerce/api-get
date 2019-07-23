'use strict';

const ApiGetError = require('../api-get-error');
const camelize = require('../utils/camelize');

class EndpointParser {

	static parse(endpoint) {

		if(!endpoint)
			throw new ApiGetError('Endpoint not set.', ApiGetError.codes.INTERNAL_ERROR);

		const sanitizedEndpoint = endpoint.replace(/^\/?(api\/)?/i, '');

		if(!sanitizedEndpoint)
			throw new ApiGetError('Invalid Rest endpoint.', ApiGetError.codes.INVALID_REQUEST_DATA);

		const sanitizedEndpointParts = sanitizedEndpoint.split('/');

		const partsQuantity = sanitizedEndpointParts.length;

		if((partsQuantity % 2) !== 0)
			throw new ApiGetError('Invalid Get endpoint.', ApiGetError.codes.INVALID_REQUEST_DATA);

		let modelName;
		let recordId;
		const parents = {};

		for(let i = 0; i < partsQuantity; i += 2) {
			if((i + 2) < partsQuantity)
				parents[camelize(sanitizedEndpointParts[i].toLowerCase())] = sanitizedEndpointParts[i + 1];
			else {
				modelName = sanitizedEndpointParts[i].toLowerCase();
				recordId = sanitizedEndpointParts[i + 1];
			}
		}

		return {
			modelName,
			recordId,
			parents
		};
	}

}

module.exports = EndpointParser;
