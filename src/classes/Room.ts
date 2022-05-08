import App from "../App";
import utils from "../libs/utils/utils";
import Business from "./Business";
import ChatMessage from "./ChatMessage";
import ChatReplyOption from "./ChatReplyOption";
const TAG = "ROOM.TS";
type resultMessage = {
	remove: () => void;
};
export type RoomState = "started" | "loading" | "closed" | "error";
interface RoomType {
	id?: string;
	idUser: string;
	creationDate: number;
	state: RoomState;
}
class Room implements RoomType {
	id: string;
	idUser: string;
	creationDate: number;
	state: RoomState;
	//others
	start: boolean;
	lastBotMessage: ChatMessage;
	lastUserMessage: ChatMessage;
	currentReplyOption: ChatReplyOption;
	private _app?: App;
	private _business?: Business;
	private _closeRoom?: () => void;
	private _currentMessagesCloseTimer: () => void;
	private minuteToWaitUser: number;
	private maxLoadingUserWait: number;
	constructor(data: RoomType | null, app: App, business: Business) {
		this.id = data?.id || "";
		this.idUser = data?.idUser || "";
		this.creationDate = data?.creationDate || 0;
		this.state = "closed";
		//others
		this.start = false;
		this.currentReplyOption = new ChatReplyOption(null);
		this.lastBotMessage = new ChatMessage(null);
		this.lastUserMessage = new ChatMessage(null);
		//privates
		this._app = app;
		this._business = business;
		this._closeRoom = () => {};
		this._currentMessagesCloseTimer = () => {};
		this.minuteToWaitUser = 1000 * 60;
		this.maxLoadingUserWait = 3000;
	}

	public set app(v: App) {
		this.app = v;
	}

	public get app(): App {
		return this._app;
	}

	startListener(theApp: App, business: Business) {
		const that = this;
		if (theApp) that._app = theApp;
		const app = that._app;
		if (that._closeRoom) that._closeRoom();
		that.lastBotMessage = new ChatMessage(null);
		let unsubs = () => {};
		let changeStateToClose = () => {};

		let stoped = false;

		if (app) {
			const refRoom = app
				.database()
				.collection("business")
				.doc(business.id)
				.collection("rooms")
				.doc(that.id);

			const refMessages = refRoom.collection("messages");

			const uniqueKey = utils.generateKey("key");

			unsubs = refMessages
				.orderBy("serverDate", "desc")
				.limit(1)
				.onSnapshot(
					(snap) => {
						console.log("New Message received in :" + uniqueKey);
						if (stoped) {
							console.log("stoped, warning");
							return;
						}
						if (!snap.empty) {
							const doc = snap.docs[0];
							const newData = doc.data();
							newData.id = doc.id;

							const newMessage = new ChatMessage(newData);
							try {
								if (newMessage.isEmpty()) {
									// reject(null);
									return;
								}

								if (newMessage.creator === "{{admin}}") {
									// if (that.currentQuestion.question)
									that.lastBotMessage = newMessage;
									return;
								}
								that.lastUserMessage = newMessage;

								const firstLetter = newMessage.text!.substring(
									0,
									1
								);
								const isCommand = firstLetter === "/";

								if (isCommand) {
									that.analiceCommand(newMessage);
									return;
								}
								that.analiceMessage(newMessage);
								console.log(TAG, newMessage);
							} catch (error) {
								console.log(null);
							}
						}
					},
					(err) => {
						console.log(err);
						refRoom.update({ state: "error" });
						that.state = "error";
					}
				);
			that.listenMessagesToCloseRoom();
			refRoom.update({ state: "started" });
			that.state = "started";
			changeStateToClose = () => {
				refRoom.update({ state: "closed" });
				that.state = "closed";
			};
		}
		that._closeRoom = () => {
			stoped = true;
			unsubs();
			changeStateToClose();
			that._currentMessagesCloseTimer();
			that.start = false;
			that._closeRoom = () => null;
		};
		return that._closeRoom;
	}
	private listenMessagesToCloseRoom() {
		const that = this;
		const app = that._app;
		if (app) {
			let totalMinInative = 0;
			const idInterval = setInterval(() => {
				const lastUserMessageDate =
					that.lastUserMessage.serverDate.toDate();
				const serverDate = that.app.getServerDateTimeStamp().toDate();

				const distanceDate = utils.dates.dateToDaysHours(
					lastUserMessageDate,
					serverDate,
					true
				);

				if (distanceDate.minutes > 0) {
					totalMinInative++;
				}
				if (totalMinInative > 5 || that.state === "closed") {
					clearInterval(idInterval);
					that.sendMessageFast(
						"Sala de chat cerrada, Vuelve pronto! 👋"
					);
					that._closeRoom();
				} else if (totalMinInative > 1) {
					that.sendMessageFast(
						"Disculpa, Sigues por ahi?, Te esperare " +
							(6 - totalMinInative) +
							" minutos..."
					);
				} else {
					totalMinInative = 0;
				}
			}, that.minuteToWaitUser);
			that._currentMessagesCloseTimer = () => clearInterval(idInterval);
		}
	}
	private getGeneralsVariables() {
		const firestore = this.app.firestore;
		const business = this._business;
		const room = this;
		const app = this.app;
		const messagesColletion = firestore
			.collection("business")
			.doc(business.id)
			.collection("rooms")
			.doc(room.id)
			.collection("messages");
		return { firestore, business, room, app, messagesColletion };
	}
	//--------------------------------xxx
	private analiceReplyOption = async (
		msj: ChatMessage,
		replyOption: ChatReplyOption,
		setAnswer: boolean = false
	) => {
		// set setAnswer on true  to apply answer
		const that = this;
		const { firestore, business, room, app, messagesColletion } =
			that.getGeneralsVariables();

		if (replyOption.question) {
			that.currentReplyOption = replyOption;
			const arrAnswers = replyOption.answers || [];

			for (const key in arrAnswers) {
				const item = arrAnswers[key];
				if (item.value === "") {
					if (setAnswer && msj.text !== "") {
						arrAnswers[key].value = msj.text!;
						setAnswer = false;
					} else {
						await that.sendMessageFast(item.question);
						return;
					}
				}
			}

			if (replyOption.allAnswered && replyOption.closeAnswers) {
				const clean = () => {
					this.currentReplyOption = new ChatReplyOption(null);
					replyOption.cleanAnswers();
				};
				if (msj.hideCommand === "NO") {
					await that.sendMessageFast("Vale, cancelado!");
					await that.sendMessageFast(business.greeting);
					clean();
					return;
				}
				if (replyOption.urlRequest) {
					const res = await replyOption.sendAnswerToHook();
					await that.sendMessageFast(res);
					clean();
					return;
				}
				await that.sendMessageFast(
					replyOption.getReplyWithNames() ||
						"Gracias por responder :)"
				);
				clean();

				const newMessage2 = new ChatMessage(null);
				newMessage2.text = "Te puedo ayudar con algo mas?";
				const yesMessage = new ChatMessage(null);
				const noMessage = new ChatMessage(null);
				yesMessage.text = business.greeting;
				noMessage.text = "Vale, hasta luego";

				newMessage2.setAnswerOptions = [
					{ name: "Si", value: "YES", answer: yesMessage },
					{ name: "No", value: "NO", answer: noMessage },
				];
				await that.sendMessage(newMessage2);
				return;
			}

			let replysText = arrAnswers
				.map((item) => `*- ${item.question}* \nR/ ${item.value}`)
				.join("\n");

			replysText = `Estas son las respuestas que me diste: \n\n ${replysText} \n\n Esta correcto?`;
			const newMessage = new ChatMessage(null);
			newMessage.text = replysText;
			newMessage.setAnswerOptions = [
				{ name: "Correcto", value: "YES" },
				{ name: "Cancelar", value: "NO" },
			];
			replyOption.closeAnswers = true;
			await that.sendMessage(newMessage);
		} else {
			await that.sendMessageFast(replyOption.defaultReply!);
		}
	};
	analiceCommand = async (msj: ChatMessage) => {};
	analiceMessage = async (msj: ChatMessage) => {
		const that = this;
		const { firestore, business, room, app, messagesColletion } =
			that.getGeneralsVariables();

		try {
			const loading = that.sendMessageLoading();
			if (!that.currentReplyOption.isEmpty()) {
				await that.analiceReplyOption(
					msj,
					that.currentReplyOption,
					true
				);
				loading.remove();
				return;
			}

			if (that.lastBotMessage.hasAnswerOptions) {
				const msjResult = that.lastBotMessage.analiceReply(msj);
				if (msjResult) {
					await that.sendMessage(msjResult);
					loading.remove();
					return;
				}
			}

			if (!that.start) {
				// Wellcome
				that.start = true;
				await that.sendMessageFast(business!.greeting);
				loading.remove();
				return;
			}

			const replys = await business.getReplyOptions(app);

			for (const key in replys) {
				let reply = replys[key];
				if (reply.id === that.currentReplyOption.id)
					reply = that.currentReplyOption;

				if (msj.text!.includes(reply.coincidence)) {
					await that.analiceReplyOption(msj, reply);
					loading.remove();
					return;
				}
			}

			that.sendMessageFast(
				"No te he entendido 😔, intenta con una de las opciones que te di 😉"
			);
			loading.remove();
		} catch (error) {
			console.log(TAG, error);
		}
	};
	//--------------------------------MESSAGES
	sendMessage = (msj: ChatMessage) => {
		const that = this;
		const { firestore, business, room, app, messagesColletion } =
			that.getGeneralsVariables();
		if (msj.creator === "") msj.creator = "{{admin}}";
		if (msj.creationDate === 0) {
			msj.creationDate = utils.dates.dateNowUnix();
			msj.serverDate = app.getServerDateTimeStamp();
		}
		const doc = messagesColletion.doc();

		that.lastBotMessage = msj;

		return new Promise<resultMessage>((resolve, reject) => {
			try {
				const send = () => {
					doc.set(msj.exportToUpload())
						.then(() => {
							resolve({
								remove: () => doc.delete(),
							});
						})
						.catch((err) => {
							reject(err);
						});
				};

				const timeout = 450 * (msj.text.length || 1);
				const unLoading = that.sendMessageLoading();
				setTimeout(
					() => {
						send();
						unLoading.remove();
					},
					timeout > that.maxLoadingUserWait
						? that.maxLoadingUserWait
						: timeout
				);
			} catch (error) {
				reject(null);
			}
		});
	};

	sendMessageFast = (reply: string) => {
		const that = this;
		if (that.state === "closed") {
			return;
		}
		const { firestore, business, room, app, messagesColletion } =
			that.getGeneralsVariables();
		const msj = new ChatMessage(null);
		msj.creator = "{{admin}}";
		msj.text = reply;
		msj.creationDate = utils.dates.dateNowUnix();
		msj.serverDate = app.getServerDateTimeStamp();
		msj.type = "text";
		if (reply.toLocaleLowerCase().includes("hola")) {
			msj.setAnswerOptions = [
				{ name: "Hola", value: "hello" },
				{ name: "Que tal!", value: "hello" },
				{ name: "👋", value: "hello" },
			];
		}
		that.lastBotMessage = msj;

		const doc = messagesColletion.doc();

		return new Promise<resultMessage>((resolve, reject) => {
			try {
				const send = () => {
					doc.set(msj.exportToUpload())
						.then(() => {
							resolve({
								remove: () => doc.delete(),
							});
						})
						.catch((err) => {
							reject(err);
						});
				};
				const timeout = 450 * (reply.length || 1);
				const unLoading = that.sendMessageLoading();
				setTimeout(
					() => {
						send();
						unLoading.remove();
					},
					timeout > that.maxLoadingUserWait
						? that.maxLoadingUserWait
						: timeout
				);
			} catch (error) {
				reject(null);
			}
		});
	};

	sendMessageLoading = () => {
		const that = this;
		if (that.state === "closed") {
			return;
		}
		const { firestore, business, room, app, messagesColletion } =
			that.getGeneralsVariables();
		const writingColletion = firestore
			.collection("business")
			.doc(business.id)
			.collection("rooms")
			.doc(room.id)
			.collection("writing");

		const doc = writingColletion.doc("ToriChatbot");

		doc.set({
			serverDate: app.getServerDateTimeStamp(),
			creationDate: utils.dates.dateNowUnix(),
		});

		return {
			remove: () => doc.delete(),
		};
	};

	exportObject() {
		return utils.objects.cloneObject(this, true);
	}
}
export default Room;
