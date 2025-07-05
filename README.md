# Web Audit Tool

This repository includes a simple Node.js script that audits a web page for
console errors, network errors, and page load time using [Puppeteer](https://pptr.dev).
It can optionally summarize the results using the OpenAI API if an API key is
provided.

## Prerequisites

- Node.js 18 or later
- Chromium or Chrome installed locally
- Optional: set `PUPPETEER_SKIP_DOWNLOAD=true` to skip Chromium download when installing dependencies

## Installation

```bash
npm install
```

## Usage

Run the audit script with a URL. Set `OPENAI_API_KEY` to enable summarization:

```bash
npm run audit -- https://example.com
```

The script will output any console errors, failed network requests, and the total
load time in milliseconds. If `OPENAI_API_KEY` is set, a concise summary will be
printed as well.
