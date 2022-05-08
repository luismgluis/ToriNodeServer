import utils from "../libs/utils/utils";

interface ChatReplyOptionType {
	id?: string;
	coincidence: string;
	question?: boolean;
	answers?: questionType[];
	closeAnswers?: boolean;

	urlRequest?: string;
	defaultReply?: string;
}
type questionType = {
	question: string;
	name: string;
	value: string;
};
export default class ChatReplyOption {
	id?: string;
	coincidence: string;
	question?: boolean;
	answers?: questionType[];
	closeAnswers?: boolean;

	urlRequest?: string;
	defaultReply?: string;

	constructor(data: null | ChatReplyOptionType) {
		this.id = data?.id || "";
		this.coincidence = data?.coincidence || "";
		this.question = data?.question || false;
		this.urlRequest = data?.urlRequest || "";
		this.defaultReply = data?.defaultReply || "";
		this.answers = [];
		this.closeAnswers = data?.closeAnswers || false;

		try {
			if (data?.answers) {
				if (Array.isArray(data?.answers)) {
					this.answers = data.answers;
				} else {
					this.answers = JSON.parse(<any>data.answers);
				}
			}
			this.cleanAnswers();
		} catch (error) {}
	}
	isEmpty() {
		return this.id === "" && this.coincidence === "";
	}
	public get allAnswered(): boolean {
		if (Array.isArray(this.answers)) {
			const res = this.answers.every((item) => item.value !== "");
			return res;
		}
		return true;
	}
	sendAnswerToHook() {
		return new Promise<string>((resolve, reject) => {
			try {
				resolve("any reply");
			} catch (error) {
				reject(null);
			}
		});
	}
	getReplyWithNames() {
		const url = encodeURIComponent;
		let text = this.defaultReply!;
		this.answers!.forEach(
			(item) => (text = text.replace("${" + item.name + "}", item.value))
		);
		if (text.includes("https:")) {
			this.answers!.forEach(
				(item) =>
					(text = text.replace(
						url("${" + item.name + "}"),
						url(item.value)
					))
			);
		}

		return text;
	}
	cleanAnswers() {
		this.closeAnswers = false;
		this.answers = this.answers!.map((item) => {
			item.value = "";
			return item;
		});
	}
	cloneObject() {
		return utils.objects.cloneObject(this);
	}
	exportToUpload() {
		return {
			coincidence: this.coincidence,
			question: this.question,
			urlRequest: this.urlRequest,
			defaultReply: this.defaultReply,
			answers: JSON.stringify(this.answers),
		};
	}
}
