'use strict';

const assert = require('assert');

const sandbox = require('sinon').createSandbox();

const { ApiGet } = require('..');
const { ApiGetError } = require('../lib');

describe('ApiGet', () => {

	afterEach(() => {
		sandbox.restore();
	});

	describe('Validation', () => {

		it('Should throw if endpoint is empty', async () => {

			const getModelInstanceFake = sandbox.stub(ApiGet.prototype, '_getModelInstance');
			getModelInstanceFake.returns({});

			const apiGet = new ApiGet();
			apiGet.endpoint = '';
			apiGet.data = {};
			apiGet.headers = {};

			await assert.rejects(() => apiGet.validate(), ApiGetError);
		});

		it('Should throw if endpoint is not a valid rest endpoint', async () => {

			const getModelInstanceFake = sandbox.stub(ApiGet.prototype, '_getModelInstance');
			getModelInstanceFake.returns({});

			const apiGet = new ApiGet();
			apiGet.endpoint = '/api/';
			apiGet.data = {};
			apiGet.headers = {};

			await assert.rejects(() => apiGet.validate(), ApiGetError);
		});

		it('Should throw if pathParameters are not set', async () => {

			const apiGet = new ApiGet();
			apiGet.endpoint = '/api/some-entity/10';

			await assert.rejects(() => apiGet.validate(), ApiGetError);
		});

		it('Should throw if pathParameters is empty', async () => {

			const apiGet = new ApiGet();
			apiGet.endpoint = '/api/some-entity/10';
			apiGet.pathParameters = [];

			await assert.rejects(() => apiGet.validate(), ApiGetError);
		});

		it('Should throw if pathParameters has an invalid ID', async () => {

			const apiGet = new ApiGet();
			apiGet.endpoint = '/api/some-entity/10';
			apiGet.pathParameters = [{ notAValidId: 'yeah' }];

			await assert.rejects(() => apiGet.validate(), ApiGetError);
		});

		it('Should throw if model is not found', async () => {

			const getModelInstanceFake = sandbox.stub(ApiGet.prototype, '_getModelInstance');
			getModelInstanceFake.throws('Model does not exist');

			const apiGet = new ApiGet();
			apiGet.endpoint = '/api/some-entity/10';
			apiGet.pathParameters = ['10'];

			await assert.rejects(() => apiGet.validate(), ApiGetError);
		});

		it('Should validate if a valid model and ID is passed', async () => {

			const getModelInstanceFake = sandbox.stub(ApiGet.prototype, '_getModelInstance');
			getModelInstanceFake.returns({});

			const apiGet = new ApiGet();
			apiGet.endpoint = '/api/some-entity/10';
			apiGet.pathParameters = ['10'];

			const validation = await apiGet.validate();

			assert.strictEqual(validation, undefined);

			sandbox.assert.calledOnce(getModelInstanceFake);
			sandbox.assert.calledWithExactly(getModelInstanceFake, `${process.cwd()}/models/some-entity`);
		});
	});

	describe('Process', () => {

		it('Should pass endpoint parents to the model get as filters', async () => {

			const getFake = sandbox.fake.returns([]);

			const getModelInstanceFake = sandbox.stub(ApiGet.prototype, '_getModelInstance');
			getModelInstanceFake.returns({
				get: getFake
			});

			const apiGet = new ApiGet();
			apiGet.endpoint = '/api/some-parent/10/some-entity/2';
			apiGet.pathParameters = ['10', '2'];

			await apiGet.validate();

			await apiGet.process();

			sandbox.assert.calledOnce(getFake);
			sandbox.assert.calledWithExactly(getFake, {
				page: 1,
				limit: 1,
				filters: {
					id: '2',
					someParent: '10'
				}
			});
		});

		it('Should parse filters if parse method is defined', async () => {

			const getFake = sandbox.fake.returns([]);

			const getModelInstanceFake = sandbox.stub(ApiGet.prototype, '_getModelInstance');
			getModelInstanceFake.returns({
				get: getFake
			});

			class MyApiGet extends ApiGet {
				_parseFilters({ id, ...otherFilters }) {
					return {
						foo: 'someHardcodedFilter',
						id: Number(id),
						...otherFilters
					};
				}
			}

			const apiGet = new MyApiGet();
			apiGet.endpoint = '/api/some-parent/10/some-entity/2';
			apiGet.pathParameters = ['10', '2'];

			await apiGet.validate();

			await apiGet.process();

			sandbox.assert.calledOnce(getFake);
			sandbox.assert.calledWithExactly(getFake, {
				page: 1,
				limit: 1,
				filters: {
					foo: 'someHardcodedFilter',
					id: 2,
					someParent: '10'
				}
			});
		});

		it('Should throw an internal error if get fails', async () => {

			const getModelInstanceFake = sandbox.stub(ApiGet.prototype, '_getModelInstance');
			getModelInstanceFake.returns({
				get: () => {
					throw new Error('Some internal error');
				}
			});

			const apiGet = new ApiGet();
			apiGet.endpoint = '/api/some-entity/10';
			apiGet.pathParameters = ['10'];

			await apiGet.validate();

			await assert.rejects(() => apiGet.process());
		});

		it('Should set a 404 code and return a message if record is not found', async () => {

			const getFake = sandbox.fake.returns([]);
			const getModelInstanceFake = sandbox.stub(ApiGet.prototype, '_getModelInstance');
			getModelInstanceFake.returns({
				get: getFake
			});

			const apiGet = new ApiGet();
			apiGet.endpoint = '/api/some-entity/10';
			apiGet.pathParameters = ['10'];

			await apiGet.validate();

			await apiGet.process();

			assert.deepStrictEqual(apiGet.response.code, 404);
			assert.deepStrictEqual(apiGet.response.body, {
				message: 'common.message.notFound'
			});

			sandbox.assert.calledOnce(getFake);
			sandbox.assert.calledWithExactly(getFake, {
				filters: {
					id: '10'
				},
				page: 1,
				limit: 1
			});
		});

		it('Should set response body with DB record if no format method is defined', async () => {

			const dbRecord = {
				id: '10',
				foo: 'bar'
			};

			const getFake = sandbox.fake.returns([dbRecord]);
			const getModelInstanceFake = sandbox.stub(ApiGet.prototype, '_getModelInstance');
			getModelInstanceFake.returns({
				get: getFake
			});

			const apiGet = new ApiGet();
			apiGet.endpoint = '/api/some-entity/10';
			apiGet.pathParameters = ['10'];

			await apiGet.validate();

			await apiGet.process();

			assert.deepStrictEqual(apiGet.response.body, dbRecord);

			sandbox.assert.calledOnce(getFake);
			sandbox.assert.calledWithExactly(getFake, {
				filters: {
					id: '10'
				},
				page: 1,
				limit: 1
			});
		});

		it('Should set response body with the formatted record if format method is defined', async () => {

			class MyApiGet extends ApiGet {
				format(record) {
					return {
						...record,
						moreFoo: 'baz'
					};
				}
			}

			const dbRecord = {
				id: '10',
				foo: 'bar'
			};

			const expectedRecord = {
				id: '10',
				foo: 'bar',
				moreFoo: 'baz'
			};

			const getFake = sandbox.fake.returns([dbRecord]);
			const getModelInstanceFake = sandbox.stub(ApiGet.prototype, '_getModelInstance');
			getModelInstanceFake.returns({
				get: getFake
			});

			const apiGet = new MyApiGet();
			apiGet.endpoint = '/api/some-entity/10';
			apiGet.pathParameters = ['10'];

			await apiGet.validate();

			await apiGet.process();

			assert.deepStrictEqual(apiGet.response.body, expectedRecord);

			sandbox.assert.calledOnce(getFake);
			sandbox.assert.calledWithExactly(getFake, {
				filters: {
					id: '10'
				},
				page: 1,
				limit: 1
			});
		});
	});

});
