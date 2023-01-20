'use strict';

const { API } = require('@janiscommerce/api');

const { struct } = require('@janiscommerce/superstruct');

const path = require('path');
const Fields = require('./data-helpers/fields');

const ApiGetError = require('./api-get-error');
const EndpointParser = require('./helpers/endpoint-parser');

/**
 * @typedef {Object} ApiGetError A instance of APIGetError class
 */

module.exports = class ApiGet extends API {

	/**
	 * Get the fields to select from the DB.
	 *
	 * @returns {Array|false|undefined} - The fields to select
	 */
	get fieldsToSelect() {
		return undefined;
	}

	/**
	 * Get the fields to be excluded from the response
	 *
	 * @returns {Array|undefined} - The fields to be excluded
	 */
	get fieldsToExclude() {
		return undefined;
	}

	/**
	 * Get the fixed fields, this are fields that can't be removed from responses
	 *
	 * @returns {Array|undefined} - The fixed fields
	 */
	get fixedFields() {
		return undefined;
	}

	/**
	 *  Perform validations before processing
	 * 	Set the Model to use and parse the Endpoint
	 *  Important, it is not advisable to overwrite it
	 * @returns {void}
	 */
	async validate() {

		this._parseEndpoint();

		this._validateModel();

		await this.validateId();

		this.validateFields();

		return this.postValidate();
	}

	/**
	 * Validates if path ID type is valid.
	 * Validation will only be performed if database driver has `idStruct` getter implemented.
	 * @returns {void}
	 */
	async validateId() {

		let idStruct;

		try {
			idStruct = await this.model.getIdStruct();
		} catch(error) {
			this.setCode(500);
			throw error;
		}

		if(idStruct)
			idStruct(this.recordId);
	}

	/**
	 *  It is to perform validations for the parameters fields and excludeFields
	 * @returns {*}
	 */
	validateFields() {

		this.fields = new Fields(this.fieldsToSelect, this.fieldsToExclude, this.fixedFields);

		try {

			const structFields = struct.optional(this.fields.struct());

			structFields(this.data);

		} catch(e) {
			throw new ApiGetError(e, ApiGetError.codes.INVALID_REQUEST_DATA);
		}
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
			...this.fields.getParams(this.data),
			filters: this._parseFilters(filters),
			page: 1,
			limit: 1
		};

		const record = await this.model.get(getParams);

		if(!record.length) {
			return this
				.setCode(404)
				.setBody({
					message: 'common.message.notFound'
				});
		}

		[this.record] = record;

		await this.postGetValidate(this.record);

		const response = await this.format(this.record);

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
			/* istanbul ignore next */
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
