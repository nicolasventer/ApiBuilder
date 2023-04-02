import http from "http";

export type Parser = (text: string) => any;
export const identityParser = (text: string) => text;

export type ApiGetFn = (req: http.IncomingMessage) => Promise<Response>;
export type ApiPostFn = (req: http.IncomingMessage, bodyFn: (parser?: Parser) => Promise<any>) => Promise<Response>;
export type HttpFn = (req: http.IncomingMessage, res: http.ServerResponse) => void;

type Method = "GET" | "POST" | "DELETE" | "PATCH" | "PUT";

export const DEFAULT_ON_PATH_NOT_FOUND: HttpFn = (req, res) => {
	res.statusCode = 404;
	res.end(`Not found: ${req.method} ${req.url}`);
};

export class ApiBuilder {
	constructor(public onPathNotFound: HttpFn = DEFAULT_ON_PATH_NOT_FOUND) {}

	private _api = {
		GET: new Map<string, ApiGetFn>(),
		DELETE: new Map<string, ApiPostFn>(),
		POST: new Map<string, ApiPostFn>(),
		PATCH: new Map<string, ApiPostFn>(),
		PUT: new Map<string, ApiPostFn>(),
	};

	private _use: HttpFn[] = [];
	private _useStr = "";

	public use(fn: HttpFn | string) {
		if (fn instanceof Function) this._use.push(fn);
		else this._useStr += fn;
		return this;
	}

	public get(api: string, fn: ApiGetFn) {
		this._api.GET.set(this._useStr + api, fn);
		return this;
	}

	public post(api: string, fn: ApiPostFn) {
		this._api.POST.set(this._useStr + api, fn);
		return this;
	}

	public delete(api: string, fn: ApiPostFn) {
		this._api.DELETE.set(this._useStr + api, fn);
		return this;
	}

	public patch(api: string, fn: ApiPostFn) {
		this._api.PATCH.set(this._useStr + api, fn);
		return this;
	}

	public put(api: string, fn: ApiPostFn) {
		this._api.PUT.set(this._useStr + api, fn);
		return this;
	}

	// default parser is JSON.parse
	private getBody = (req: http.IncomingMessage) => (parser?: Parser) => {
		return new Promise((resolve) => {
			let bodyStr = "";
			req.on("data", (chunk) => (bodyStr += chunk.toString()));
			req.on("end", () => resolve(parser ? parser(bodyStr) : JSON.parse(bodyStr)));
		});
	};

	public async executeNoCatch(req: http.IncomingMessage, res: http.ServerResponse) {
		const bodyFn = this.getBody(req);
		if (req.method === "OPTIONS") {
			for (const fn of this._use) fn(req, res);
			res.statusCode = 200;
			res.end();
			return;
		}
		const apiFn = this._api[req.method as Method]?.get(req.url?.split("?")[0] || "");
		if (!apiFn) return this.onPathNotFound(req, res);
		for (const fn of this._use) fn(req, res);
		const response = await apiFn(req, bodyFn);
		const text = await response.text();
		res.statusCode = response.status;
		res.end(text);
	}

	public async execute(req: http.IncomingMessage, res: http.ServerResponse) {
		this.executeNoCatch(req, res).catch((error) => {
			console.error(`Error in ${req.url}: `, error);
			res.statusCode = 500;
			res.end("Internal server error");
		});
	}
}
