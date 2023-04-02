# ApiBuilder

# Description

ApiBuilder is a typescript/javascript library that allows you to create an api server with the native http module.

# Features

- functions `get`, `post`, `put`, `patch` and `delete` to register a route
- function `use` to register a middleware
- errors caught in the `execute` function

# Installation

### Prerequisites

*(It is recommanded to install Node and npm with [nvm](https://github.com/nvm-sh/nvm), check for [nvm-windows](https://github.com/coreybutler/nvm-windows) if you are on Windows)*
- [Node.js](https://nodejs.org/en/) (v19.0.0)
- [npm](https://www.npmjs.com/) (v9.7.2)

```bash
# Install ts-node
npm install -g ts-node@10.9.1
# Install nodemon
npm install -g nodemon@2.0.22
```

### Install dependencies

```bash
npm install
```

# Example

hello.ts:

```typescript
import { ApiGetFn, ApiPostFn, identityParser } from "./ApiBuilder";

export const postHello: ApiPostFn = async (req, bodyFn) => {
	const body = (await bodyFn(identityParser)) as string; // identityParser for raw text, default is JSON.parse
	return new Response(`Hello ${body}!`);
};

export const getHello: ApiGetFn = async (req) => new Response(`Hello from ${req.url}`);
```

index.ts:

```typescript
import http from "http";
import { getHello, postHello } from "./hello";
import { ApiBuilder } from "./ApiBuilder";

const PORT = 3000;
const URL = `http://localhost:${PORT}`;

//#region API

const apiBuilder: ApiBuilder = new ApiBuilder();
apiBuilder.get("/hello", getHello);
apiBuilder.post("/hello", postHello);

//#endregion

const server = http.createServer((req, res) => apiBuilder.execute(req, res));

server.listen(PORT, () => {
	console.log(`Server running at ${URL}/`);
});
```

Now you can run the server with `npm start` and test it with `curl`:

```bash
curl -X GET http://localhost:3000/hello
# Hello from /hello!
curl -X POST http://localhost:3000/hello -d "world"
# Hello world!
```

# Usage


```typescript
export const DEFAULT_ON_PATH_NOT_FOUND: HttpFn = (req, res) => {};

export class ApiBuilder {
	constructor(public onPathNotFound: HttpFn = DEFAULT_ON_PATH_NOT_FOUND) {}

	public use(fn: HttpFn | string) {}

	public get(api: string, fn: ApiGetFn) {}

	public post(api: string, fn: ApiPostFn) {}

	public delete(api: string, fn: ApiPostFn) {}

	public patch(api: string, fn: ApiPostFn) {}

	public put(api: string, fn: ApiPostFn) {}

	public async executeNoCatch(req: http.IncomingMessage, res: http.ServerResponse) {}

	public async execute(req: http.IncomingMessage, res: http.ServerResponse) {}
}
```


# License

MIT Licence. See [LICENSE file](LICENSE).
Please refer me with:

	Copyright (c) Nicolas VENTER All rights reserved.