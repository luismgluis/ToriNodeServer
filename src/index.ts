import App from "./App";
import * as express from "express";
import Room from "./classes/Room";
import Business from "./classes/Business";
import Dictionary from "./classes/Dictionary";
import utils from "./libs/utils/utils";

const TAG = "index";
let mysoftWifiSerial = "spacoma123";
if (typeof process.env.mysoftWifiSerial !== "undefined") {
	// mysoftWifiSerial = process.env.mysoftWifiSerial; //WORKKKK
}

const myApp = new App(mysoftWifiSerial); //serial

const onStart = () => {
	const port = (() => {
		let num = 3001;
		if (process.env.NODE_ENV !== "development") {
			const envPort = Number(process.env.PORT);
			if (!isNaN(envPort)) num = envPort;
		}
		return num;
	})();

	const app = express();
	const api = myApp.api;

	let listeners: Record<string, () => { creationDate: string; room: Room }> =
		{};

	const startBusinessRoom = (idBusiness: string, idRoom: string) => {
		const startListener = async (business: Business, room: Room) => {
			try {
				const unsubs = await room.startListener(myApp, business);
				listeners[room.id] = () => {
					unsubs();
					return {
						creationDate: utils.dates.dateNowString(true, true),
						room: room,
					};
				};
				await room.sendMessageFast("Hola");
			} catch (error) {
				console.log(error);
			}
		};

		return new Promise<Room>((resolve, reject) => {
			api.business
				.getBusiness(idBusiness)
				.then(async (business) => {
					if (business) {
						const room = await api.business
							.getRoom(business, idRoom)
							.then((res) => res)
							.catch((err) => null);
						if (room) {
							startListener(business, room);
							resolve(room);
							return;
						}
						const newRoom = await api.business
							.createRoom(business, idRoom)
							.then((res) => res)
							.catch((err) => null);
						if (newRoom) {
							resolve(newRoom);
							startListener(business, newRoom);
							return;
						}
					}
					reject("ROOM ERROR");
				})
				.catch((err) => {
					reject(err);
				});
		});
	};

	const exit = () => {
		let counter = 0;
		let message = "";
		Object.keys(listeners).forEach((item) => {
			if (typeof listeners[item] === "function") {
				const res = listeners[item]();
				message += res.creationDate + " - " + res.room.id + "\n";
				listeners[item] = null;
				delete listeners[item];
				counter++;
			}
		});
		return message + "\n" + "listeners closed (" + counter + ")";
		// process.exit(); // considerable pero no necesario, cuidao
	};

	app.get("/", (req, response) => {
		const bad = () => {
			response.status(400); //Bad Request
			response.send("without business request");
		};

		try {
			const data: any = req.query;
			if (typeof data.b !== "undefined") {
				const business = data.b;
				const room = data.r;
				startBusinessRoom(business, room)
					.then((res) => {
						response
							.status(200)
							.json(JSON.stringify({ result: "Room Started" }));
					})
					.catch((err) => {
						response.status(203).send("without results");
					});
				return;
			}
			bad();
		} catch (error) {
			bad();
		}
	});
	app.get("/startRoom/:business/:room", (req, res) => {
		try {
			Object.keys(listeners).forEach((item) => {
				if (typeof listeners[item] === "function") {
					listeners[item]();
				}
			});
			res.send("listeners closed");
		} catch (error) {}
	});

	app.get("/close", (req, res) => {
		try {
			const resultExit = exit();
			res.send(resultExit);
		} catch (error) {}
	});

	app.listen(port, () => {
		console.log("The application is listening on port " + port + "!");
	});

	process.on("exit", () => {
		exit();
		process.exit();
	});
};

myApp
	.start()
	.then((res) => {
		onStart();
	})
	.catch((err) => {
		console.log(err);
	});
