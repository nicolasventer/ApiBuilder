// @ts-check

import http from "http";

/** @typedef {(text: string) => any} Parser */

/**
 * @param {string} text
 * @returns
 */
export const identityParser = (text) => text;

/** @typedef {{ (req: http.IncomingMessage): Promise<Response> }} ApiGetFn */
/** @typedef {(req: http.IncomingMessage, bodyFn: (parser?: Parser) => Promise<any>) => Promise<Response>} ApiPostFn */
/** @typedef {(req: http.IncomingMessage, res: http.ServerResponse) => void} HttpFn */

/** @type {HttpFn} */
export const DEFAULT_ON_PATH_NOT_FOUND = (req, res) => {
	res.statusCode = 404;
	res.end(`Not found: ${req.method} ${req.url}`);
};

export const ApiBuilder = function (onPathNotFound = DEFAULT_ON_PATH_NOT_FOUND) {
	const _api = {
		/** @type {Map<string, ApiGetFn>} */
		GET: new Map(),
		/** @type {Map<string, ApiPostFn>} */
		DELETE: new Map(),
		/** @type {Map<string, ApiPostFn>} */
		POST: new Map(),
		/** @type {Map<string, ApiPostFn>} */
		PATCH: new Map(),
		/** @type {Map<string, ApiPostFn>} */
		PUT: new Map(),
	};
	/** @type {HttpFn[]} */
	const _use = [];
	let _useStr = "";

	/** @type {(fn: HttpFn | string) => ApiBuilder} */
	this.use = (fn) => {
		if (fn instanceof Function) _use.push(fn);
		else _useStr += fn;
		return this;
	};
	/** @type {(api: string, fn: ApiGetFn) => ApiBuilder} */
	this.get = (api, fn) => {
		_api.GET.set(_useStr + api, fn);
		return this;
	};
	/** @type {(api: string, fn: ApiPostFn) => ApiBuilder} */
	this.post = (api, fn) => {
		_api.POST.set(_useStr + api, fn);
		return this;
	};
	/** @type {(api: string, fn: ApiPostFn) => ApiBuilder} */
	this.delete = (api, fn) => {
		_api.DELETE.set(_useStr + api, fn);
		return this;
	};
	/** @type {(api: string, fn: ApiPostFn) => ApiBuilder} */
	this.patch = (api, fn) => {
		_api.PATCH.set(_useStr + api, fn);
		return this;
	};
	/** @type {(api: string, fn: ApiPostFn) => ApiBuilder} */
	this.put = (api, fn) => {
		_api.PUT.set(_useStr + api, fn);
		return this;
	};
	/** @typedef {(req: http.IncomingMessage) => (parser?: Parser) => Promise<any>} GetBodyFn */
	const getBody = (req) => (parser) =>
		new Promise((resolve) => {
			let bodyStr = "";
			req.on("data", (chunk) => (bodyStr += chunk.toString()));
			req.on("end", () => resolve(parser ? parser(bodyStr) : JSON.parse(bodyStr)));
		});
	/** @type {(req: http.IncomingMessage, res: http.ServerResponse) => Promise<void>} */
	this.executeNoCatch = async (req, res) => {
		const bodyFn = getBody(req);
		if (req.method === "OPTIONS") {
			for (const fn of _use) fn(req, res);
			res.statusCode = 200;
			res.end();
			return;
		}
		const apiFn = _api[req.method]?.get(req.url?.split("?")[0] || "");
		if (!apiFn) return onPathNotFound(req, res);
		for (const fn of _use) fn(req, res);
		const response = await apiFn(req, bodyFn);
		const text = await response.text();
		res.statusCode = response.status;
		res.end(text);
	};
	/** @type {(req: http.IncomingMessage, res: http.ServerResponse) => Promise<void>} */
	this.execute = async (req, res) =>
		this.executeNoCatch(req, res).catch((error) => {
			console.log(`Error in ${req.url}: `, error);
			res.statusCode = 500;
			res.end("Internal server error");
		});
};
