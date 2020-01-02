# simulators

[![Git Commit](https://img.shields.io/github/last-commit/mojaloop/simulator.svg?style=flat)](https://github.com/mojaloop/simulator/commits/master)
[![Git Releases](https://img.shields.io/github/release/mojaloop/simulator.svg?style=flat)](https://github.com/mojaloop/simulator/releases)
[![Docker pulls](https://img.shields.io/docker/pulls/mojaloop/simulator.svg?style=flat)](https://hub.docker.com/r/mojaloop/simulator)
[![CircleCI](https://circleci.com/gh/mojaloop/simulator.svg?style=svg)](https://circleci.com/gh/mojaloop/simulator)

Simulators that act as mock payer fsp and payee fsp which interact with the Switch.

## Environmental Vars for FSP Simulator configuration

| Variable | Description | Default |
|---|---|---|
| PARTIES_ENDPOINT | Mojaloop Callback Endpoint for Parties | 'http://localhost:1080' | |
| QUOTES_ENDPOINT | Mojaloop Callback Endpoint for Quotes | 'http://localhost:1080' | |
| TRANSFERS_ENDPOINT | Mojaloop Callback Endpoint for Transfers | 'http://localhost:1080' |
| TRANSFERS_FULFIL_RESPONSE_DISABLED | Flag to disable the Fulfil response callback to the TRANSFER_ENDPOINT | 'false' |
| TRANSFERS_FULFILMENT | ILP Fulfilment value | 'XoSz1cL0tljJSCp_VtIYmPNw-zFUgGfbUqf69AagUzY' |
| TRANSFERS_CONDITION | ILP Fulfilment condition | 'HOr22-H3AfTDHrSkPjJtVPRdKouuMkDXTR4ejlQa8Ks' |
| TRANSFERS_ILPPACKET | ILP Packet | 'AQAAAAAAAADIEHByaXZhdGUucGF5ZWVmc3CCAiB7InRyYW5zYWN0aW9uSWQiOiIyZGY3NzRlMi1mMWRiLTRmZjctYTQ5NS0yZGRkMzdhZjdjMmMiLCJxdW90ZUlkIjoiMDNhNjA1NTAtNmYyZi00NTU2LThlMDQtMDcwM2UzOWI4N2ZmIiwicGF5ZWUiOnsicGFydHlJZEluZm8iOnsicGFydHlJZFR5cGUiOiJNU0lTRE4iLCJwYXJ0eUlkZW50aWZpZXIiOiIyNzcxMzgwMzkxMyIsImZzcElkIjoicGF5ZWVmc3AifSwicGVyc29uYWxJbmZvIjp7ImNvbXBsZXhOYW1lIjp7fX19LCJwYXllciI6eyJwYXJ0eUlkSW5mbyI6eyJwYXJ0eUlkVHlwZSI6Ik1TSVNETiIsInBhcnR5SWRlbnRpZmllciI6IjI3NzEzODAzOTExIiwiZnNwSWQiOiJwYXllcmZzcCJ9LCJwZXJzb25hbEluZm8iOnsiY29tcGxleE5hbWUiOnt9fX0sImFtb3VudCI6eyJjdXJyZW5jeSI6IlVTRCIsImFtb3VudCI6IjIwMCJ9LCJ0cmFuc2FjdGlvblR5cGUiOnsic2NlbmFyaW8iOiJERVBPU0lUIiwic3ViU2NlbmFyaW8iOiJERVBPU0lUIiwiaW5pdGlhdG9yIjoiUEFZRVIiLCJpbml0aWF0b3JUeXBlIjoiQ09OU1VNRVIiLCJyZWZ1bmRJbmZvIjp7fX19' |
| MOCK_JWS_SIGNATURE | Mock JWS SIgnature used for PUT messages | 'abcJjvNrkyK2KBieDUbGfhaBUn75aDUATNF4joqA8OLs4QgSD7i6EO8BIdy6Crph3LnXnTM20Ai1Z6nt0zliS_qPPLU9_vi6qLb15FOkl64DQs9hnfoGeo2tcjZJ88gm19uLY_s27AJqC1GH1B8E2emLrwQMDMikwQcYvXoyLrL7LL3CjaLMKdzR7KTcQi1tCK4sNg0noIQLpV3eA61kess' |

## Environment Variables for Metrics configuration

| Variable | Description | Default |
|---|---|---|
| METRICS_DISABLED | Flag to disable the Prometheus Metric collection end-point | false |
| METRICS_PREFIX | Prefix for all Prometheus Metrics | 'moja_sim_' |
| METRICS_TIMEOUT | Prometheus Metric collection timeout | 5000 |
| METRICS_SERVICENAME | Prometheus Metric serviceName label applied to all Simulator metrics | simulator |

## Building Docker image:

`$ VER=v1.0.6-snapshot; docker build -t mojaloop/simulator:$VER .; docker push mojaloop/simulator:$VER`    

## Run in Docker (in Dev)

`$ docker-compose up` 

 or (to rebuild the docker image if source code has been modified)

`$ docker-compose up --build` 

## Auditing Dependencies

We use `npm-audit-resolver` along with `npm audit` to check dependencies for vulnerabilities, and keep track of resolved dependencies with an `audit-resolv.json` file.

To start a new resolution process, run:
```bash
npm run audit:resolve
```

You can then check to see if the CI will pass based on the current dependencies with:
```bash
npm run audit:check
```

And commit the changed `audit-resolv.json` to ensure that CircleCI will build correctly.