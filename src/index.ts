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
