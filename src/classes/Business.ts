import { cloneClass, instanceToClass } from "clone-class";
import App from "../App";
import utils from "../libs/utils/utils";
import ChatReplyOption from "./ChatReplyOption";
import Dictionary from "./Dictionary";
import Room from "./Room";

export interface BusinessInterface {
	id: string;
	name: string;
	at: string;
	email: string;
	description?: string;
	creationDate: number;
	greeting: string;
	isNull?: boolean;
	urlImg?: string;
}
export default class Business implements BusinessInterface {
	id: string;
	name: string;
	at: string;
	email: string;
	greeting: string;
	description?: string;
	creationDate: number;
	isNull?: boolean;
	urlImg?: string;
	private _allRooms: Dictionary<Room>;
	private _replyOptions: ChatReplyOption[] | null;
	constructor(data: BusinessInterface | null, isNull?: boolean) {
		this.name = data?.name || "";
		this.id = data?.id || "";
		this.at = data?.at || "";
		this.email = data?.email || "";
		this.greeting = data?.greeting || "";
		this.description = data?.description || "";
		this.isNull = isNull || false; // check if Business has not initialized
		this.urlImg = data?.urlImg || "";
		this.creationDate = data?.creationDate || 0;
		//privates
		this._replyOptions = null;
		this._allRooms = {};
	}

	public get allRooms(): Dictionary<Room> {
		return this._allRooms;
	}

	addRoom(room: Room) {
		this._allRooms[room.id] = room;
	}

	public get isEmpty(): boolean {
		return this.id === "";
	}
	validate() {
		if (this.name.length < 2) return false;
		if (!utils.validateEmail(this.email)) return false;
		if (this.creationDate <= 0) return false;
		return true;
	}
	getReplyOptions(app: App) {
		const that = this;
		const firestore = app.database();
		return new Promise<ChatReplyOption[]>((resolve, reject) => {
			try {
				let data = that._replyOptions;
				if (data) {
					data = data.map((item) => {
						return new ChatReplyOption(item);
					});
					resolve(data);
					return;
				}

				firestore
					.collection("business")
					.doc(that.id)
					.collection("replyOptions")
					.get()
					.then((res) => {
						const newData: ChatReplyOption[] = [];
						if (!res.empty) {
							res.docs.forEach((doc) => {
								try {
									const data: any = doc.data();
									data.id = doc.id;
									newData.push(new ChatReplyOption(data));
								} catch (error) {
									console.log(error);
								}
							});

							that._replyOptions = newData.map((item) => {
								return new ChatReplyOption(item);
							});
						}
						resolve(newData);
					})
					.catch((err) => {
						reject(null);
					});
			} catch (error) {
				reject(error);
			}
		});
	}
	exportObject() {
		return utils.objects.cloneObject(this);
	}
}
