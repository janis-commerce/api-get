'use strict';

const fixture = [];

fixture.push({
	description: 'It should throw if endpoint is empty',
	endpoint: '',
	error: true
});

fixture.push({
	description: 'It should throw if endpoint only has the rest api prefix',
	endpoint: '/api',
	error: true
});

fixture.push({
	description: 'It should throw if endpoint is not a get endpoint',
	endpoint: '/api/some-entity',
	error: true
});

fixture.push({
	description: 'It pass for a simple get endpoint',
	endpoint: '/api/some-entity/1',
	result: {
		modelName: 'some-entity',
		recordId: '1',
		parents: {}
	}
});

fixture.push({
	description: 'It pass for a get endpoint with one parent',
	endpoint: '/api/some-parent/1/other-entity/2',
	result: {
		modelName: 'other-entity',
		recordId: '2',
		parents: {
			someParent: '1'
		}
	}
});

fixture.push({
	description: 'It pass for a get endpoint with two parents',
	endpoint: '/api/some-parent/1/other-parent/5/other-entity/10',
	result: {
		modelName: 'other-entity',
		recordId: '10',
		parents: {
			someParent: '1',
			otherParent: '5'
		}
	}
});

fixture.push({
	description: 'It pass for non numeric IDs',
	endpoint: '/api/some-parent/some-non-numeric-id/other-entity/yet-another-id',
	result: {
		modelName: 'other-entity',
		recordId: 'yet-another-id',
		parents: {
			someParent: 'some-non-numeric-id'
		}
	}
});

module.exports = fixture;
