'use strict';

const { struct } = require('@janiscommerce/superstruct');

module.exports = class ListFields {

	constructor(fieldsToSelect, fieldsToExclude, fixedFields) {
		this.fieldsToSelect = fieldsToSelect;
		this.fieldsToExclude = fieldsToExclude;
		this.fixedFields = fixedFields;
	}

	struct() {
		return {
			fields: struct.optional(['string']),
			excludeFields: struct.optional(['string'])
		};
	}

	getParams({ fields: receivedFields = [], excludeFields: receivedExcludeFields = [] } = {}) {

		// receivedFields son SOLO los campos que el usuario quiere obtener
		// receivedExcludeFields son los campos que el usuario solicita eliminar

		// this.fieldsToSelect es lo que el MS definio que se debe pedir "como maximo"
		// this.fieldsToExclude es lo que el MS definio que nunca se debe poder pedir (se deben sacar de fields si llegan)
		// this.fixedFields es lo que el MS definio que SIEMPRE tiene que devolverse (no se pueden sacar)

		const excludeFields = [
			...receivedExcludeFields,
			...this.fieldsToExclude || []
		].filter(field => this.canExcludeField(field));

		const fields = [
			...receivedFields.filter(field => this.canSelectField(field)),
			...!receivedFields.length && this.fieldsToSelect ? this.fieldsToSelect.filter(field => !receivedExcludeFields?.includes(field)) : []
		];

		if(fields.length && this.fixedFields)
			fields.push(...this.fixedFields);

		return {
			...fields.length && { fields: [...new Set(fields)] },
			...excludeFields.length && !fields.length && { excludeFields: [...new Set(excludeFields)] }
		};
	}

	canSelectField(field) {

		if(this.fieldsToSelect === false)
			return false;

		if(this.fieldsToSelect && !this.fieldsToSelect.includes(field))
			return false;

		if(this.fieldsToExclude?.includes(field))
			return false;

		return true;
	}

	canExcludeField(field) {
		return !this.fixedFields?.includes(field) && this.fieldsToExclude !== false;
	}
};
