'use strict';

/**
 * Transform the string entered in camelCase format
 * @param {String} string
 * @returns {String}
 */
const camelize = string => string.replace(/-+([^-])/g, (_, firstLetter) => firstLetter.toUpperCase());

module.exports = camelize;
