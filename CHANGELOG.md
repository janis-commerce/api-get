# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Struct validation for path id

## [4.0.1] - 2021-12-13
### Added
- Typings build from JSDoc

### Changed
- Updated dependencies

## [4.0.0] - 2020-08-27
### Added
- GitHub Actions for build, coverage and publish
- Added Type-definitions

### Changed
- Updated `@janiscommerce/api` to `6.x.x`

## [3.1.0] - 2020-07-30
## Added
- `postGetValidate` method to validate registry after getting it

## [3.0.0] - 2020-06-15
### Changed
- API upgraded to v5 (`api-session` validates locations) (**BREAKING CHANGE**)

## [2.1.0] - 2020-05-19
### Removed
- `package-lock.json` file

## [2.0.1] - 2020-01-21
### Changed
- Dependencies updated

## [2.0.0] - 2019-10-01
### Changed
- API upgraded to v4 (`api-session` injected) (**BREAKING CHANGE**)
- Model v3 compatibility (`api-session` injection) (**BREAKING CHANGE**)

## [1.2.1] - 2019-08-28
### Added
- Now the format in process method awaits a promise

## [1.2.0] - 2019-08-27
### Added
- Now you can define the `fieldsToSelect()` getter in your api to reduce or add fields that will be retrieved from the DB

## [1.1.0] - 2019-07-25
### Added
- Client model for client injected apis

## [1.0.1] - 2019-07-23
### Fixed
- Fix for AWS request path without basePath
- Removed some wrong test cases
- Fixed a typo in a test case

## [1.0.0] - 2019-07-22
### Added
- Project inited
- API Get
- Tests
