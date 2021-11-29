'use strict';

const { API } = require('@janiscommerce/api');
const path = require('path');

const ApiGetError = require('./api-get-error');
const EndpointParser = require('./helpers/endpoint-parser');

/**
 * @typedef {Object} ApiGetError A instance of APIGetError class
 */

class ApiGet extends API {

	/**
	 * Validate the model, extracted from the parsed endpoint
	 */
	async validate() {

		this._parseEndpoint();

		this._validateModel();
	}

	/**
	 * It makes the query to the DB with the filters and params obtained from the endpoint
	 * @returns {void}
	 */
	async process() {

		const filters = {
			...this.parents,
			id: this.recordId
		};

		const getParams = {
			filters: this._parseFilters ? this._parseFilters(filters) : filters,
			page: 1,
			limit: 1
		};

		if(this.fieldsToSelect)
			getParams.fields = this.fieldsToSelect;

		const record = await this.model.get(getParams);

		if(!record.length) {
			return this
				.setCode(404)
				.setBody({
					message: 'common.message.notFound'
				});
		}

		[this.record] = record;

		if(this.postGetValidate)
			await this.postGetValidate(this.record);

		const response = this.format ? await this.format(this.record) : this.record;

		this.setBody(response);
	}

	/**
	 * Set the modelName, recordId and parents of API after parsing the endpoint
	 */
	_parseEndpoint() {

		const { modelName, recordId, parents } = EndpointParser.parse(this.endpoint);

		this.modelName = modelName;
		this.recordId = recordId;
		this.parents = parents;
	}

	/**
	 * Set the model of the API getting the model instance from its name
	 * @throws {ApiGetError} if the model not exists
	 */
	_validateModel() {
		try {
			this.model = this._getModelInstance(path.join(process.cwd(), process.env.MS_PATH || '', 'models', this.modelName));
		} catch(e) {
			throw new ApiGetError(e, ApiGetError.codes.INVALID_ENTITY);
		}
	}

	/**
	 * Get the instance of the Model indicated by parameter
	 * @param {String} modelPath The model path
	 * @returns {Object} An instance injected with the session
	 */
	_getModelInstance(modelPath) {

		// eslint-disable-next-line global-require, import/no-dynamic-require
		const Model = require(modelPath);

		if(!this.session)
			return new Model();

		return this.session.getSessionInstance(Model);
	}

}

module.exports = ApiGet;
