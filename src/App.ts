import * as admin from "firebase-admin";
import Business from "./classes/Business";
import ChatMessage from "./classes/ChatMessage";
import FireApi from "./database/FireApi";

const serviceAccount = require("../config/firebaseconfig.json");

class App {
	started: boolean;
	api: FireApi;
	private fireApp: admin.app.App;
	currentBusiness: Business;
	constructor(serialToken: string) {
		this.started = false;
		this.api = new FireApi(this);
	}

	initializeListeners() {
		const that = this;

		return () => {
			//close
		};
	}

	async start() {
		const that = this;
		if (that.started) return true;

		try {
			// admin.initializeApp();
			that.fireApp = admin.initializeApp(
				{
					credential: admin.credential.cert(<any>serviceAccount),
				},
				"chatbotTori"
			);

			//--post initialize
			that.started = true;

			that.initializeListeners();

			return true;
		} catch (error) {
			that.started = false;
			throw new Error(error);
		}
	}

	async validateBusiness(idToken: string) {
		const data = await this.api.business.getBusiness(idToken);
		if (data) {
			this.currentBusiness = data;
			return data;
		}
		return null;
	}

	public get firestore() {
		if (!this.started) this.start();
		return this.fireApp.firestore();
	}

	public database() {
		if (!this.started) this.start();
		return this.fireApp.firestore();
	}
	public get storage() {
		if (!this.started) this.start();
		return this.fireApp.storage();
	}

	getServerDateTimeStamp() {
		return admin.firestore.Timestamp.now();
	}
	serverTimeStampToDate(timestamp: admin.firestore.Timestamp) {
		return timestamp.toDate();
	}
}

export default App;
