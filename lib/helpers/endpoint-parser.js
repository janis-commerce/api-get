'use strict';

const ApiGetError = require('../api-get-error');
const camelize = require('../utils/camelize');

/**
 * @typedef {Object} ParseEndpoint
 * @property {String} [modelName] The model name
 * @property {String} [recordId] The ID of the record
 * @property {String} [parents] The rest of the text string that does not have a specific function
*/

class EndpointParser {
	/**
	 * Parse the endpoint passed by parameter in different parts for use
	 * @param {String} endpoint The endpoint to parse
	 * @returns {ParseEndpoint} The parsed endpoint
	 */
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
