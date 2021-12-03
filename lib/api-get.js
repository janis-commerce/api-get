'use strict';

const { API } = require('@janiscommerce/api');
const path = require('path');

const ApiGetError = require('./api-get-error');
const EndpointParser = require('./helpers/endpoint-parser');

/**
 * @typedef {Object} ApiGetError A instance of APIGetError class
 */

module.exports = class ApiGet extends API {

	/**
	 *  Perform validations before processing
	 * 	Set the Model to use and parse the Endpoint
	 *  Important, it is not advisable to overwrite it
	 * @returns {void}
	 */
	async validate() {

		this._parseEndpoint();
		this._validateModel();

		return this.postValidate();
	}

	/**
	 *  It is to perform extra validations
	 * @returns {*}
	 */
	async postValidate() {
		return true;
	}

	/**
	 * It makes the query to the DB with the filters and params obtained from the endpoint
	 * Important, it is not advisable to overwrite it
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
	 * Validates the record getted from DB before format.
	 * @param {Object} record The record in DB
	 * @returns {*}
	 */
	async postGetValidate(record) {
		return record;
	}

	/**
	 * For format your record before they are returned.
	 * @param {Object} record The record in DB
	 * @returns {Object}
	 */
	async format(record) {
		return record;
	}

	/**
	 * To parse any field of the record
	 * @param {Object} record The record in DB
	 * @returns {Object} The record parsed
	 */
	_parseFilters(record) {
		return record;
	}

	/**
	 * Set the modelName, recordId and parents of API after parsing the endpoint
	 * @returns {void}
	 */
	_parseEndpoint() {

		const { modelName, recordId, parents } = EndpointParser.parse(this.endpoint);

		if(!this.modelName)
			this.modelName = modelName;

		this.modelName = modelName;
		this.recordId = recordId;
		this.parents = parents;
	}

	/**
	 * Set the model of the API getting the model instance from its name
	 * @throws {ApiGetError} if the model not exists
	 * @returns {void}
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

};
