# Keysplease tests

Various automated tests using playwright to test analytics capabilities and issues.

## Setup

You will need [Node.js](https://nodejs.org/en/) and npm (any decently recent version, say >=16)

Clone the repo, then `npm install` to download and install the required dependencies, e.g.

```
git clone https://github.com/underscoren/keysplease-analytics-test.git
cd keysplease-analytics-test
npm install
```

## Usage

To run the tests, run `npx playwright test`

Should any tests fail, your browser will open with a report detailing the results of every test.

To view the last generated report at any time, run `npx playwright show-report` (or check the `playwright-report` folder for `index.html`)

# Development

See the [Playwright docs](https://playwright.dev/docs/intro) for more info.