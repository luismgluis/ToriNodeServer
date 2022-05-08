import App from "../App";

export type FireDoc =
	| FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
	| FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>;

import FireDatabaseBusiness from "./business/FireDatabaseBusiness";

class FireApi {
	app: App;
	business: FireDatabaseBusiness;
	constructor(app: App) {
		this.app = app;
		this.business = new FireDatabaseBusiness(app);
	}
}
export default FireApi;
