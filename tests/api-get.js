'use strict';

const assert = require('assert');
const path = require('path');

const sinon = require('sinon');
const mockRequire = require('mock-require');

const { ApiGet, ApiGetError } = require('../lib');

describe('ApiGet', () => {

	afterEach(() => {
		sinon.restore();
	});

	class Model {
	}

	const modelPath = path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'some-entity');

	describe('Validation', () => {

		before(() => {
			mockRequire(modelPath, Model);
		});

		after(() => {
			mockRequire.stop(modelPath);
		});

		it('Should throw if endpoint is empty', async () => {

			const apiGet = new ApiGet();
			apiGet.endpoint = '';
			apiGet.data = {};
			apiGet.headers = {};

			await assert.rejects(() => apiGet.validate(), ApiGetError);
		});

		it('Should throw if endpoint is not a valid rest endpoint', async () => {

			const apiGet = new ApiGet();
			apiGet.endpoint = '/';
			apiGet.data = {};
			apiGet.headers = {};

			await assert.rejects(() => apiGet.validate(), ApiGetError);
		});

		it('Should throw if model is not found', async () => {

			const apiGet = new ApiGet();
			apiGet.endpoint = '/some-other-entity/10';
			apiGet.pathParameters = ['10'];

			await assert.rejects(() => apiGet.validate(), ApiGetError);
		});

		it('Should validate if a valid model and ID is passed', async () => {

			const apiGet = new ApiGet();
			apiGet.endpoint = '/some-entity/10';
			apiGet.pathParameters = ['10'];

			const validation = await apiGet.validate();

			assert.strictEqual(validation, true);
		});
	});

	describe('Process', () => {

		it('Should pass endpoint parents to the model get as filters', async () => {

			class MyModel {
				async get() {
					return [];
				}
			}

			mockRequire(modelPath, MyModel);

			sinon.spy(MyModel.prototype, 'get');

			const apiGet = new ApiGet();
			apiGet.endpoint = '/some-parent/10/some-entity/2';
			apiGet.pathParameters = ['10', '2'];

			await apiGet.validate();

			await apiGet.process();

			sinon.assert.calledOnce(MyModel.prototype.get);
			sinon.assert.calledWithExactly(MyModel.prototype.get, {
				page: 1,
				limit: 1,
				filters: {
					id: '2',
					someParent: '10'
				}
			});

			mockRequire.stop(modelPath);
		});

		it('Should parse filters if parse method is defined', async () => {

			class MyModel {
				async get() {
					return [];
				}
			}

			mockRequire(modelPath, MyModel);

			sinon.spy(MyModel.prototype, 'get');

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
			apiGet.endpoint = '/some-parent/10/some-entity/2';
			apiGet.pathParameters = ['10', '2'];

			await apiGet.validate();

			await apiGet.process();

			sinon.assert.calledOnce(MyModel.prototype.get);
			sinon.assert.calledWithExactly(MyModel.prototype.get, {
				page: 1,
				limit: 1,
				filters: {
					foo: 'someHardcodedFilter',
					id: 2,
					someParent: '10'
				}
			});

			mockRequire.stop(modelPath);
		});

		it('Should use regular model when there is no session in API', async () => {

			class MyModel {
				async get() {
					return [];
				}
			}

			mockRequire(modelPath, MyModel);

			sinon.spy(MyModel.prototype, 'get');

			const apiGet = new ApiGet();
			apiGet.endpoint = '/some-entity/10';
			apiGet.data = {};
			apiGet.headers = {};

			await apiGet.validate();

			await apiGet.process();

			sinon.assert.calledOnce(MyModel.prototype.get);
			sinon.assert.calledWithExactly(MyModel.prototype.get, {
				page: 1,
				limit: 1,
				filters: {
					id: '10'
				}
			});

			assert.deepEqual(apiGet.model.session, undefined);

			mockRequire.stop(modelPath);
		});

		it('Should use injected model when API has a session', async () => {

			class MyModel {
				async get() {
					return [];
				}
			}

			mockRequire(modelPath, MyModel);

			sinon.spy(MyModel.prototype, 'get');

			const sessionMock = {
				getSessionInstance: sinon.fake(() => {
					const modelInstance = new MyModel();
					modelInstance.session = sessionMock;

					return modelInstance;
				})
			};

			const apiGet = new ApiGet();
			apiGet.endpoint = '/some-entity/10';
			apiGet.data = {};
			apiGet.headers = {};
			apiGet.session = sessionMock;

			await apiGet.validate();

			await apiGet.process();

			sinon.assert.calledOnce(MyModel.prototype.get);
			sinon.assert.calledWithExactly(MyModel.prototype.get, {
				page: 1,
				limit: 1,
				filters: {
					id: '10'
				}
			});

			sinon.assert.calledOnce(sessionMock.getSessionInstance);
			sinon.assert.calledWithExactly(sessionMock.getSessionInstance, MyModel);

			mockRequire.stop(modelPath);
		});

		it('Should throw an internal error if get fails', async () => {

			mockRequire(modelPath, class MyModel {
				async get() {
					throw new Error('Some internal error');
				}
			});

			const apiGet = new ApiGet();
			apiGet.endpoint = '/some-entity/10';
			apiGet.pathParameters = ['10'];

			await apiGet.validate();

			await assert.rejects(() => apiGet.process());

			mockRequire.stop(modelPath);
		});

		it('Should set a 404 code and return a message if record is not found', async () => {

			class MyModel {
				async get() {
					return [];
				}
			}

			mockRequire(modelPath, MyModel);

			sinon.spy(MyModel.prototype, 'get');

			const apiGet = new ApiGet();
			apiGet.endpoint = '/some-entity/10';
			apiGet.pathParameters = ['10'];

			await apiGet.validate();

			await apiGet.process();

			assert.deepStrictEqual(apiGet.response.code, 404);
			assert.deepStrictEqual(apiGet.response.body, {
				message: 'common.message.notFound'
			});

			sinon.assert.calledOnce(MyModel.prototype.get);
			sinon.assert.calledWithExactly(MyModel.prototype.get, {
				filters: {
					id: '10'
				},
				page: 1,
				limit: 1
			});

			mockRequire.stop(modelPath);
		});

		it('Should set response body with DB record if no format method is defined', async () => {

			const dbRecord = {
				id: '10',
				foo: 'bar'
			};

			class MyModel {
				async get() {
					return [dbRecord];
				}
			}

			mockRequire(modelPath, MyModel);

			sinon.spy(MyModel.prototype, 'get');

			const apiGet = new ApiGet();
			apiGet.endpoint = '/some-entity/10';
			apiGet.pathParameters = ['10'];

			await apiGet.validate();

			await apiGet.process();

			assert.deepStrictEqual(apiGet.response.body, dbRecord);

			sinon.assert.calledOnce(MyModel.prototype.get);
			sinon.assert.calledWithExactly(MyModel.prototype.get, {
				filters: {
					id: '10'
				},
				page: 1,
				limit: 1
			});

			mockRequire.stop(modelPath);
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

			class MyModel {
				async get() {
					return [dbRecord];
				}
			}

			mockRequire(modelPath, MyModel);

			sinon.spy(MyModel.prototype, 'get');

			const apiGet = new MyApiGet();
			apiGet.endpoint = '/some-entity/10';
			apiGet.pathParameters = ['10'];

			await apiGet.validate();

			await apiGet.process();

			assert.deepStrictEqual(apiGet.response.body, expectedRecord);

			sinon.assert.calledOnce(MyModel.prototype.get);
			sinon.assert.calledWithExactly(MyModel.prototype.get, {
				filters: {
					id: '10'
				},
				page: 1,
				limit: 1
			});

			mockRequire.stop(modelPath);
		});

		it('Should pass fields to select if the getter is defined', async () => {

			class MyModel {
				async get() {
					return [];
				}
			}

			mockRequire(modelPath, MyModel);

			sinon.spy(MyModel.prototype, 'get');

			class MyApiGet extends ApiGet {
				get fieldsToSelect() {
					return ['id', 'name', 'status'];
				}
			}

			const apiGet = new MyApiGet();
			apiGet.endpoint = '/some-entity/1';
			apiGet.data = {};
			apiGet.headers = {};

			await apiGet.validate();

			await apiGet.process();

			sinon.assert.calledOnce(MyModel.prototype.get);
			sinon.assert.calledWithExactly(MyModel.prototype.get, {
				filters: { id: '1' },
				page: 1,
				limit: 1,
				fields: ['id', 'name', 'status']
			});

			mockRequire.stop(modelPath);
		});

		it('Should set response body with the formatted record when post get validation is defined and the record passes the validation', async () => {

			class MyApiGet extends ApiGet {
				format(record) {
					return {
						...record,
						moreFoo: 'baz'
					};
				}

				async postGetValidate({ foo }) {

					if(foo !== 'bar') {
						this.setCode(403);
						throw new Error('Forbidden Foo');
					}
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

			class MyModel {
				async get() {
					return [dbRecord];
				}
			}

			mockRequire(modelPath, MyModel);

			sinon.spy(MyModel.prototype, 'get');

			const apiGet = new MyApiGet();
			apiGet.endpoint = '/some-entity/10';
			apiGet.pathParameters = ['10'];

			await apiGet.validate();

			await apiGet.process();

			assert.deepStrictEqual(apiGet.response.body, expectedRecord);

			sinon.assert.calledOnce(MyModel.prototype.get);
			sinon.assert.calledWithExactly(MyModel.prototype.get, {
				filters: {
					id: '10'
				},
				page: 1,
				limit: 1
			});

			mockRequire.stop(modelPath);
		});

		it('Should set status code 403 when post get validation is defined and the record does not pass the validation', async () => {

			class MyApiGet extends ApiGet {
				format(record) {
					return {
						...record,
						moreFoo: 'baz'
					};
				}

				async postGetValidate({ foo }) {

					if(foo !== 'bar') {
						this.setCode(403);
						throw new Error('Forbidden Foo');
					}
				}
			}

			const dbRecord = {
				id: '10',
				foo: 'no-bar'
			};

			class MyModel {
				async get() {
					return [dbRecord];
				}
			}

			mockRequire(modelPath, MyModel);

			sinon.spy(MyModel.prototype, 'get');

			const apiGet = new MyApiGet();
			apiGet.endpoint = '/some-entity/10';
			apiGet.pathParameters = ['10'];

			await apiGet.validate();

			await assert.rejects(apiGet.process(), { message: 'Forbidden Foo' });

			assert.deepStrictEqual(apiGet.response.code, 403);

			sinon.assert.calledOnce(MyModel.prototype.get);
			sinon.assert.calledWithExactly(MyModel.prototype.get, {
				filters: {
					id: '10'
				},
				page: 1,
				limit: 1
			});

			mockRequire.stop(modelPath);
		});

		it('should rejects with 400 statusCode using postValidate custom validation', async () => {

			class MyApiGet extends ApiGet {
				async postValidate() {
					throw new Error('Error validating');
				}
			}

			class MyModel {
				async get() {
					return [];
				}
			}

			mockRequire(modelPath, MyModel);

			sinon.spy(MyModel.prototype, 'get');

			const apiGet = new MyApiGet();
			apiGet.endpoint = '/some-entity/10';
			apiGet.pathParameters = ['10'];

			await assert.rejects(() => apiGet.validate(), Error('Error validating'));

			mockRequire.stop(modelPath);
		});

		it('Should validate APIs modelName if it has modelName', async () => {

			class MyApiGet extends ApiGet {
				get modelName() {
					return 'other-entity';
				}
			}

			class OtherEntityModel {
				async get() {
					return [];
				}
			}

			const pathOtherEntity = path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'other-entity');

			mockRequire(pathOtherEntity, OtherEntityModel);

			const apiGet = new MyApiGet();
			apiGet.endpoint = '/some-entity/10';
			apiGet.pathParameters = ['10'];

			const validation = await apiGet.validate();
			assert.strictEqual(validation, true);

			mockRequire.stop(modelPath);
		});
	});

});
