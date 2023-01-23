'use strict';

const sinon = require('sinon');
const assert = require('assert');

const path = require('path');

const { struct } = require('@janiscommerce/superstruct');
const Model = require('@janiscommerce/model');

const mockRequire = require('mock-require');

const { ApiGet, ApiGetError } = require('../lib');

describe('ApiGet', () => {

	afterEach(() => {
		sinon.restore();
	});

	class MyModel extends Model {}
	class OtherModel extends Model {}

	const modelPath = path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'some-entity');
	const otherModelPath = path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'other-entity');

	const getApiInstance = (ApiClass, {
		endpoint, headers, data, session, pathParameters
	} = {}) => {

		const apiInstance = new ApiClass();

		apiInstance.endpoint = typeof endpoint !== 'undefined' ? endpoint : 'some-entity/10';
		apiInstance.headers = headers || {};

		apiInstance.pathParameters = pathParameters || ['10'];

		if(data)
			apiInstance.data = data || {};

		if(session)
			apiInstance.session = session;

		return apiInstance;
	};

	const assertGet = params => {
		sinon.assert.calledOnceWithExactly(MyModel.prototype.get, {
			page: 1,
			limit: 1,
			filters: { id: '10' },
			...params
		});
	};

	beforeEach(() => {
		mockRequire(modelPath, MyModel);
		mockRequire(otherModelPath, OtherModel);

		sinon.stub(MyModel.prototype, 'getIdStruct')
			.resolves(undefined);
	});

	afterEach(() => {
		mockRequire.stopAll();
	});

	describe('Validation', () => {

		it('Should throw if endpoint is empty', async () => {

			const apiGet = getApiInstance(ApiGet, {
				endpoint: ''
			});

			await assert.rejects(apiGet.validate(), ApiGetError);
		});

		it('Should throw if endpoint is not a valid rest endpoint', async () => {

			const apiGet = getApiInstance(ApiGet, {
				endpoint: '/'
			});

			await assert.rejects(apiGet.validate(), ApiGetError);
		});

		it('Should throw if model is not found', async () => {

			const apiGet = getApiInstance(ApiGet, {
				endpoint: '/unknown-entity/10'
			});

			await assert.rejects(apiGet.validate(), ApiGetError);
		});

		describe('getIdStruct validation', () => {

			it('Should reject if model fails on getting idStruct', async () => {

				sinon.stub(OtherModel.prototype, 'getIdStruct')
					.rejects(new Error('Internal Error'));

				const apiGet = getApiInstance(ApiGet, {
					endpoint: '/other-entity/10',
					pathParameters: ['10']
				});

				await assert.rejects(apiGet.validate(), { message: 'Internal Error' });
			});

			it('Should reject if invalid ID is passed', async () => {

				sinon.stub(OtherModel.prototype, 'getIdStruct')
					.resolves(struct('objectId'));

				const apiGet = getApiInstance(ApiGet, {
					endpoint: '/other-entity/10',
					pathParameters: ['10']
				});

				await assert.rejects(apiGet.validate(), { message: 'Expected a value of type `objectId` but received `"10"`.' });
			});

			it('Should not reject if invalid parent ID is passed', async () => {

				sinon.stub(OtherModel.prototype, 'getIdStruct')
					.resolves(struct('objectId'));

				const apiGet = getApiInstance(ApiGet, {
					endpoint: '/some-parent/10/some-entity/6282c2484f64bffff55bcd7c',
					pathParameters: ['10', '6282c2484f64bffff55bcd7c']
				});

				assert.deepStrictEqual(await apiGet.validate(), true);
			});
		});

		it('Should validate if a valid model and ID is passed', async () => {

			const apiGet = getApiInstance(ApiGet);

			const validation = await apiGet.validate();

			assert.strictEqual(validation, true);
		});

		describe('Reducing response with fields and excludeFields', () => {

			beforeEach(() => {
				sinon.stub(MyModel.prototype, 'get')
					.resolves([]);
			});

			context('When invalid parameters received', () => {

				it('Should reject if fields param is received as string', async () => {

					const apiGet = getApiInstance(ApiGet, {
						data: { fields: 'foo' }
					});

					await assert.rejects(apiGet.validate(), ApiGetError);
				});

				it('Should reject if fields param is received as number', async () => {

					const apiGet = getApiInstance(ApiGet, {
						data: { fields: 8 }
					});

					await assert.rejects(apiGet.validate(), ApiGetError);
				});

				it('Should reject if excludeFields param is received as string', async () => {

					const apiGet = getApiInstance(ApiGet, {
						data: { excludeFields: 'bar' }
					});

					await assert.rejects(apiGet.validate(), ApiGetError);
				});

				it('Should reject if excludeFields param is received as number', async () => {

					const apiGet = getApiInstance(ApiGet, {
						data: { excludeFields: 10 }
					});

					await assert.rejects(apiGet.validate(), ApiGetError);
				});
			});
		});
	});

	describe('Process', () => {

		it('Should pass endpoint parents to the model get as filters', async () => {

			sinon.stub(MyModel.prototype, 'get')
				.resolves([{
					item: 'foo',
					value: 'bar'
				}]);

			const apiGet = getApiInstance(ApiGet, {
				endpoint: '/some-parent/10/some-entity/2',
				pathParameters: ['10', '2']
			});

			await apiGet.validate();

			await apiGet.process();

			assertGet({
				filters: {
					id: '2',
					someParent: '10'
				}
			});
		});

		it('Should parse filters if parse method is defined', async () => {

			sinon.stub(MyModel.prototype, 'get')
				.resolves([{
					item: 'foo',
					value: 'bar'
				}]);

			class MyApiGet extends ApiGet {
				_parseFilters({ id, ...otherFilters }) {
					return {
						foo: 'someHardcodedFilter',
						id: Number(id),
						...otherFilters
					};
				}
			}

			const apiGet = getApiInstance(MyApiGet, {
				endpoint: '/some-parent/10/some-entity/2',
				pathParameters: ['10', '2']
			});

			await apiGet.validate();

			await apiGet.process();

			assertGet({
				filters: {
					foo: 'someHardcodedFilter',
					id: 2,
					someParent: '10'
				}
			});
		});

		it('Should use regular model when there is no session in API', async () => {

			sinon.stub(MyModel.prototype, 'get')
				.resolves([{
					item: 'foo',
					value: 'bar'
				}]);

			const apiGet = getApiInstance(ApiGet);

			await apiGet.validate();

			await apiGet.process();

			assertGet();

			assert.deepEqual(apiGet.model.session, undefined);
		});

		it('Should use injected model when API has a session', async () => {

			sinon.stub(MyModel.prototype, 'get')
				.resolves([{
					item: 'foo',
					value: 'bar'
				}]);

			const sessionMock = {
				getSessionInstance: sinon.fake(() => {
					const modelInstance = new MyModel();
					modelInstance.session = sessionMock;

					return modelInstance;
				})
			};

			const apiGet = getApiInstance(ApiGet, {
				session: sessionMock
			});

			await apiGet.validate();

			await apiGet.process();

			assertGet();

			sinon.assert.calledOnceWithExactly(sessionMock.getSessionInstance, MyModel);
		});

		it('Should throw an internal error if get fails', async () => {

			sinon.stub(MyModel.prototype, 'get')
				.rejects('Some internal Error');

			const apiGet = getApiInstance(ApiGet);

			await apiGet.validate();

			await assert.rejects(apiGet.process());
		});

		it('Should set a 404 code and return a message if record is not found', async () => {

			sinon.stub(MyModel.prototype, 'get')
				.resolves([]);

			const apiGet = getApiInstance(ApiGet);

			await apiGet.validate();

			await apiGet.process();

			assert.deepStrictEqual(apiGet.response.code, 404);
			assert.deepStrictEqual(apiGet.response.body, {
				message: 'common.message.notFound'
			});

			assertGet();
		});

		it('Should set response body with DB record if no format method is defined', async () => {

			sinon.stub(MyModel.prototype, 'get')
				.resolves([{
					item: 'foo',
					value: 'bar'
				}]);

			const apiGet = getApiInstance(ApiGet);

			await apiGet.validate();

			await apiGet.process();

			assert.deepStrictEqual(apiGet.response.body, {
				item: 'foo',
				value: 'bar'
			});

			assertGet();
		});

		it('Should set response body with the formatted record if format method is defined', async () => {

			const dbRecord = {
				id: '10',
				foo: 'bar'
			};

			sinon.stub(MyModel.prototype, 'get')
				.resolves([dbRecord]);

			class MyApiGet extends ApiGet {
				format(record) {
					return {
						...record,
						moreFoo: 'baz'
					};
				}
			}

			const apiGet = getApiInstance(MyApiGet);

			const expectedRecord = {
				id: '10',
				foo: 'bar',
				moreFoo: 'baz'
			};

			await apiGet.validate();

			await apiGet.process();

			assert.deepStrictEqual(apiGet.response.body, expectedRecord);

			assertGet();
		});

		it('Should set response body with the formatted record when post get validation is defined and the record passes the validation', async () => {

			const dbRecord = {
				id: '10',
				foo: 'bar'
			};

			sinon.stub(MyModel.prototype, 'get')
				.resolves([dbRecord]);

			class MyApiGet extends ApiGet {

				async postGetValidate({ foo }) {
					if(foo !== 'bar') {
						this.setCode(403);
						throw new Error('Forbidden Foo');
					}
				}
			}

			const apiGet = getApiInstance(MyApiGet);

			await apiGet.validate();

			await apiGet.process();

			assert.deepStrictEqual(apiGet.response.body, dbRecord);

			assertGet();
		});

		it('Should set status code 403 when post get validation is defined and the record does not pass the validation', async () => {

			const dbRecord = {
				id: '10',
				foo: 'no-bar'
			};

			sinon.stub(MyModel.prototype, 'get')
				.resolves([dbRecord]);

			class MyApiGet extends ApiGet {

				async postGetValidate({ foo }) {
					if(foo !== 'bar') {
						this.setCode(403);
						throw new Error('Forbidden Foo');
					}
				}
			}

			const apiGet = getApiInstance(MyApiGet);

			await apiGet.validate();

			await assert.rejects(apiGet.process(), { message: 'Forbidden Foo' });

			assert.deepStrictEqual(apiGet.response.code, 403);

			assertGet();
		});

		it('Should validate APIs modelName if it has modelName', async () => {

			class MyApiGet extends ApiGet {
				get modelName() {
					return 'other-entity';
				}
			}

			const apiGet = getApiInstance(MyApiGet);

			const validation = await apiGet.validate();
			assert.strictEqual(validation, true);
		});

		describe('Reducing response with fields and excludeFields', () => {

			beforeEach(() => {
				sinon.stub(MyModel.prototype, 'get')
					.resolves([]);
			});

			context('When received valid fields', () => {

				it('Should select the fields', async () => {

					const apiGet = getApiInstance(ApiGet, {
						data: { fields: ['foo'] }
					});

					await apiGet.validate();

					await apiGet.process();

					assertGet({ fields: ['foo'] });
				});

				it('Should select the fields and ignore received excludeFields', async () => {

					const apiGet = getApiInstance(ApiGet, {
						data: {
							fields: ['foo'],
							excludeFields: ['bar']
						}
					});

					await apiGet.validate();

					await apiGet.process();

					assertGet({ fields: ['foo'] });
				});

				it('Should ignore fields when Api denied select fields', async () => {

					class MyApiList extends ApiGet {
						get fieldsToSelect() {
							return false;
						}
					}

					const apiGet = getApiInstance(MyApiList, {
						data: { fields: ['foo'] }
					});

					await apiGet.validate();

					await apiGet.process();

					assertGet();
				});

				it('Should select the fields respecting Api fields to select definition', async () => {

					class MyApiList extends ApiGet {
						get fieldsToSelect() {
							return ['foo', 'bar'];
						}
					}

					const apiGet = getApiInstance(MyApiList, {
						data: { fields: ['foo', 'not-allowed-field'] }
					});

					await apiGet.validate();

					await apiGet.process();

					assertGet({ fields: ['foo'] });
				});

				it('Should select the fields and add fixed fields defined by the Api', async () => {

					class MyApiList extends ApiGet {
						get fixedFields() {
							return ['bar'];
						}
					}

					const apiGet = getApiInstance(MyApiList, {
						data: { fields: ['foo'] }
					});

					await apiGet.validate();

					await apiGet.process();

					assertGet({ fields: ['foo', 'bar'] });
				});

				it('Should select the fields and exclude fields defined by the Api', async () => {

					class MyApiList extends ApiGet {
						get fieldsToExclude() {
							return ['bar'];
						}
					}

					const apiGet = getApiInstance(MyApiList, {
						data: { fields: ['foo', 'bar'] }
					});

					await apiGet.validate();

					await apiGet.process();

					assertGet({ fields: ['foo'] });
				});
			});

			context('When Api has fieldsToSelect defined', () => {

				it('Should select the fields', async () => {

					class MyApiList extends ApiGet {
						get fieldsToSelect() {
							return ['foo', 'bar'];
						}
					}

					const apiGet = getApiInstance(MyApiList);

					await apiGet.validate();

					await apiGet.process();

					assertGet({ fields: ['foo', 'bar'] });
				});

				it('Should select the fields and add the fixedFields defined by the Api', async () => {

					class MyApiList extends ApiGet {
						get fieldsToSelect() {
							return ['foo'];
						}

						get fixedFields() {
							return ['bar'];
						}
					}

					const apiGet = getApiInstance(MyApiList);

					await apiGet.validate();

					await apiGet.process();

					assertGet({ fields: ['foo', 'bar'] });
				});

				it('Should select the fields but exclude the excludeFields when received by param', async () => {

					class MyApiList extends ApiGet {
						get fieldsToSelect() {
							return ['foo', 'bar'];
						}
					}

					const apiGet = getApiInstance(MyApiList, {
						data: { excludeFields: ['foo'] }
					});

					await apiGet.validate();

					await apiGet.process();

					assertGet({ fields: ['bar'] });
				});
			});

			context('When received valid excludeFields', () => {

				it('Should exclude the fields', async () => {

					const apiGet = getApiInstance(ApiGet, {
						data: { excludeFields: ['foo'] }
					});

					await apiGet.validate();

					await apiGet.process();

					assertGet({ excludeFields: ['foo'] });
				});

				it('Should not to exclude fields when Api now allows it', async () => {

					class MyApiList extends ApiGet {
						get fieldsToExclude() {
							return false;
						}
					}

					const apiGet = getApiInstance(MyApiList, {
						data: { excludeFields: ['foo'] }
					});

					await apiGet.validate();

					await apiGet.process();

					assertGet();
				});

				it('Should exclude the fields and also those fields defined by the Api', async () => {

					class MyApiList extends ApiGet {
						get fieldsToExclude() {
							return ['bar'];
						}
					}

					const apiGet = getApiInstance(MyApiList, {
						data: { excludeFields: ['foo'] }
					});

					await apiGet.validate();

					await apiGet.process();

					assertGet({ excludeFields: ['foo', 'bar'] });
				});

				it('Should exclude the fields respecting fixed fields defined by the Api', async () => {

					class MyApiList extends ApiGet {
						get fixedFields() {
							return ['bar'];
						}
					}

					const apiGet = getApiInstance(MyApiList, {
						data: { excludeFields: ['foo', 'bar'] }
					});

					await apiGet.validate();

					await apiGet.process();

					assertGet({ excludeFields: ['foo'] });
				});
			});

			context('When Api defines fieldsToExclude', () => {
				it('Should exclude the fields', async () => {

					class MyApiList extends ApiGet {
						get fieldsToExclude() {
							return ['bar'];
						}
					}

					const apiGet = getApiInstance(MyApiList);

					await apiGet.validate();

					await apiGet.process();

					assertGet({ excludeFields: ['bar'] });
				});

				it('Should exclude the fields respecting fixed fields defined by the Api', async () => {

					class MyApiList extends ApiGet {
						get fieldsToExclude() {
							return ['foo', 'bar'];
						}

						get fixedFields() {
							return ['bar'];
						}
					}

					const apiGet = getApiInstance(MyApiList);

					await apiGet.validate();

					await apiGet.process();

					assertGet({ excludeFields: ['foo'] });
				});
			});
		});

	});
});
