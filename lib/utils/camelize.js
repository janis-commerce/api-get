'use strict';

const camelize = string => string.replace(/-+([^-])/g, (_, firstLetter) => firstLetter.toUpperCase());

module.exports = camelize;
