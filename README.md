# bfx-report-ui

The frontend of bfx-report at https://report.bitfinex.com

Should work with [bfx-report](https://github.com/bitfinexcom/bfx-report)


## Instructions (For alpha test)

Refer the first 2 steps from `bfx-report` project.

1. Clone `bfx-report` project and install  `grenache-grape` globally.

```
git clone https://github.com/bitfinexcom/bfx-report.git
npm i -g grenache-grape
```

2. Get PR from `bfx-report` repo and save as `pr.patch` https://github.com/bitfinexcom/bfx-report/pull/2.patch

```
cd bfx-report
curl .... > pr.patch
git apply pr.patch
npm install
```

Then copy all `config/**/*.json.example` to `config/**/*.json`

run the 4 servers (in different terminal)

```
grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002'
grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001'
npm run startWorker
npm run start
```

or run a single command

```
npm run startAll
````

instead.

3. Clone `bfx-report-ui` project

```
git clone https://github.com/bitfinexcom/bfx-report-ui.git
cd bfx-report-ui
npm install
```

4. set up your env variables to run locally:

```
export NODE_PATH=src/
export PUBLIC_URL=./
export REACT_APP_PLATFORM=localhost
```

`NODE_PATH` is used to support absolute import local package instead of relative import.
`PUBLIC_URL` is used to define default import path in `public/index.html`.
`REACT_APP_PLATFORM` is used to select the right set for site title, api endpoint and more configs.

if you want to check the performance in production or don't want to see much console logs, set an extra  env variable:

```
export NODE_ENV="production"
```

5. run the report-ui

```
npm run start
```

## Overview

The hosted version of report (https://report.bitfinex.com) will not allow access via API keys (for security reasons), https://report.bitfinex.com will be only accessible starting from https://www.bitfinex.com/report that will redirect the user to https://report.bitfinex.com/?auth=UUID

User can use either the UUID(not support yet) or the API key to access his data.

## 3rd party libraries

* react/redux/redux-saga for core architecture
* [re-ducks](https://github.com/alexnm/re-ducks)-like state structure
* blueprintjs for ui framework http://blueprintjs.com
* flexboxgrid for layout http://flexboxgrid.com/
