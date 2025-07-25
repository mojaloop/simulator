# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [12.3.2](https://github.com/mojaloop/simulator/compare/v12.3.1...v12.3.2) (2025-07-25)

### [12.3.1](https://github.com/mojaloop/simulator/compare/v12.3.0...v12.3.1) (2025-07-17)

## [12.3.0](https://github.com/mojaloop/simulator/compare/v12.2.5...v12.3.0) (2025-06-12)


### Features

* bump up the node version to v22.15.1 ([#269](https://github.com/mojaloop/simulator/issues/269)) ([4b7b347](https://github.com/mojaloop/simulator/commit/4b7b3479d1edf5081880d1a10b11b1cbb724af49))

### [12.2.5](https://github.com/mojaloop/simulator/compare/v12.2.4...v12.2.5) (2025-02-25)

### [12.2.4](https://github.com/mojaloop/simulator/compare/v12.2.3...v12.2.4) (2025-01-31)

### [12.2.3](https://github.com/mojaloop/simulator/compare/v12.2.2...v12.2.3) (2025-01-16)


### Bug Fixes

* downgrade nodejs to v18.20.4 ([#265](https://github.com/mojaloop/simulator/issues/265)) ([c31684a](https://github.com/mojaloop/simulator/commit/c31684a6f16f245ac37b2bf82683ed2e825039ed))

### [12.2.2](https://github.com/mojaloop/simulator/compare/v12.2.1...v12.2.2) (2025-01-15)

### [12.2.1](https://github.com/mojaloop/simulator/compare/v12.2.0...v12.2.1) (2024-11-14)

## [12.2.0](https://github.com/mojaloop/simulator/compare/v12.1.0...v12.2.0) (2024-06-26)


### Features

* **csi-164:** parameterize switch id ([#260](https://github.com/mojaloop/simulator/issues/260)) ([d238f71](https://github.com/mojaloop/simulator/commit/d238f710500021ffe1e9e52eaff67fa62bb7c617))

## [12.1.0](https://github.com/mojaloop/simulator/compare/v12.0.0...v12.1.0) (2023-12-20)


### Features

* **mojaloop/#3445:** nodejs upgrade ([#252](https://github.com/mojaloop/simulator/issues/252)) ([3f16bb9](https://github.com/mojaloop/simulator/commit/3f16bb9d14ca0c6a05ea437316ffb7c6b27be563)), closes [mojaloop/#3445](https://github.com/mojaloop/project/issues/3445)

## [12.0.0](https://github.com/mojaloop/simulator/compare/v11.1.3...v12.0.0) (2022-07-12)


### ⚠ BREAKING CHANGES

* **mojaloop/#2092:** Major version bump for node v16 LTS support, re-structuring of project directories to align to core Mojaloop repositories and docker image now uses `/opt/app` instead of `/opt/simulator` which will impact config mounts.

### Features

* **mojaloop/#2092:** upgrade nodeJS version for core services ([#243](https://github.com/mojaloop/simulator/issues/243)) ([bd054c6](https://github.com/mojaloop/simulator/commit/bd054c6c0f201cccede7e450b793fe6c83e50faf)), closes [mojaloop/#2092](https://github.com/mojaloop/project/issues/2092)
