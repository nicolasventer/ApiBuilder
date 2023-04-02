import { ApiGetFn, ApiPostFn, identityParser } from "./ApiBuilder";

export const postHello: ApiPostFn = async (req, bodyFn) => {
	const body = (await bodyFn(identityParser)) as string; // identityParser for raw text, default is JSON.parse
	return new Response(`Hello ${body}!`);
};

export const getHello: ApiGetFn = async (req) => new Response(`Hello from ${req.url}`);
