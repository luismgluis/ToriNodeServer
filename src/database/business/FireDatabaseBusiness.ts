import App from "../../App";
import Business from "../../classes/Business";
import Dictionary from "../../classes/Dictionary";
import Room from "../../classes/Room";
import utils from "../../libs/utils/utils";

const TAG = "FIRE DATABASE USER";
class FireDatabaseBusiness {
	private app: App;
	private allBusiness: Dictionary<Business>;
	constructor(app: App) {
		this.app = app;
		this.allBusiness = {};
	}

	getBusiness(idBusiness: string) {
		const that = this;
		const db = this.app.database();
		return new Promise<Business>((resolve, reject) => {
			try {
				if (typeof that.allBusiness[idBusiness] !== "undefined") {
					resolve(that.allBusiness[idBusiness]);
					return;
				}
				db.collection("business")
					.doc(idBusiness)
					.get()
					.then((doc) => {
						if (doc.exists) {
							const data: any = doc.data();
							data.id = doc.id;
							const business = new Business(data);
							that.allBusiness[idBusiness] = business;
							resolve(business);
							return;
						}
						reject("Not user");
					})
					.catch((err) => {
						console.log("catch", err);
						reject(err);
					});
			} catch (error) {
				reject(error);
			}
		});
	}
	getRoom(business: Business, idRoom: string) {
		const that = this;
		const db = this.app.database();
		return new Promise<Room>((resolve, reject) => {
			try {
				if (typeof business.allRooms[idRoom] !== "undefined") {
					resolve(business.allRooms[idRoom]);
					return;
				}
				db.collection("business")
					.doc(business.id)
					.collection("rooms")
					.doc(idRoom)
					.get()
					.then((doc) => {
						if (doc.exists) {
							const data: any = doc.data();
							data.id = doc.id;
							const room = new Room(data, that.app, business);
							business.addRoom(room);
							resolve(room);
							return;
						}
						reject("Not user");
					})
					.catch((err) => {
						console.log("catch", err);
						reject(err);
					});
			} catch (error) {
				reject(error);
			}
		});
	}
	createRoom(business: Business, idUser: string) {
		const that = this;
		const db = this.app.database();
		return new Promise<Room>((resolve, reject) => {
			try {
				// idUser is used as room id
				const newRoom = new Room(
					{
						id: idUser,
						idUser: idUser,
						creationDate: utils.dates.dateNowUnix(),
						state: "closed",
					},
					that.app,
					business
				);
				db.collection("business")
					.doc(business.id)
					.collection("rooms")
					.doc(idUser)
					.set(newRoom.exportObject())
					.then((doc) => {
						resolve(newRoom);
					})
					.catch((err) => {
						console.log("catch", err);
						reject(err);
					});
			} catch (error) {
				reject(error);
			}
		});
	}
}

export default FireDatabaseBusiness;
