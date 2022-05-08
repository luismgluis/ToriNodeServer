import utils from "../libs/utils/utils";
import * as admin from "firebase-admin";

type option = {
	name: string;
	value: string;
	answer?: ChatMessage;
};
interface ChatMessageInterface {
	id: string;
	creator: string;
	type: "text" | "image" | "video" | "stiker" | "audio";
	location?: string;
	text?: string;
	hideCommand?: string;
	fileUrl?: string;
	videoUrl?: string;
	serverDate?: admin.firestore.Timestamp;
	creationDate?: number;
	firstMessage?: boolean;
	lastMessage?: boolean;
	isVisibleMessage?: boolean;
	fileUpload?: boolean;
	fileSize?: number;
	fileTime?: number;
	fileDimensions?: string;
}
class ChatMessage implements ChatMessageInterface {
	id: string;
	creator: string;
	type: "text" | "image" | "video" | "stiker" | "audio";
	location?: string;
	text?: string;
	hideCommand?: string;
	fileUrl?: string;
	videoUrl?: string;
	serverDate?: admin.firestore.Timestamp;
	creationDate?: number;
	firstMessage?: boolean;
	lastMessage?: boolean;
	isVisibleMessage?: boolean;
	fileUpload?: boolean;
	fileSize?: number;
	fileTime?: number;
	fileDimensions?: string;
	private _answerOptions?: string;
	updateView?: (module: string) => void;

	constructor(data: any | null) {
		this.id = data?.id || "";
		this.text = data?.text || "";
		this.hideCommand = data?.hideCommand || "";
		this.creator = data?.creator || "";
		this.type = data?.type || "text";
		this.location = data?.location || null;
		this.fileUrl = data?.fileUrl || data?.imageUrl || "";
		this.creationDate = data?.creationDate || 0;
		this.serverDate =
			data?.serverDate || admin.firestore.Timestamp.fromMillis(0);
		this.firstMessage = utils.objects.isEmpty(data?.firstMessage)
			? false
			: data?.firstMessage;
		this.lastMessage = utils.objects.isEmpty(data?.lastMessage)
			? false
			: data?.lastMessage;
		this.isVisibleMessage = utils.objects.isEmpty(data?.isVisibleMessage)
			? false
			: data?.isVisibleMessage;
		this.fileUpload = utils.objects.isEmpty(data?.fileUpload)
			? false
			: data?.fileUpload;
		this.fileSize = data?.fileSize || 0;
		this.fileTime = data?.fileTime || 0;
		this.fileDimensions = data?.fileDimensions || "";
		const empty = () => {
			return null;
		};
		this.updateView = data?.updateView || empty;
		this._answerOptions = data?.answerOptions || "";
		if (this.type === "text") {
			this.text = data?.text;
		}
	}

	public get answerOptions(): option[] {
		const arr: option[] = [];
		if (this._answerOptions) {
			try {
				const json = JSON.parse(this._answerOptions);
				const newArr: option[] = json.data;
				newArr.forEach((i) => {
					if (i.answer) i.answer = new ChatMessage(i.answer);
					arr.push(i);
				});
			} catch (error) {}
		}
		return arr;
	}

	public set setAnswerOptions(arr: option[]) {
		const data = {
			data: arr,
		};
		this._answerOptions = JSON.stringify(data);
	}

	public get hasAnswerOptions(): boolean {
		try {
			const answers = JSON.parse(this._answerOptions);
			if (answers) {
				return true;
			}
		} catch (error) {}
		return false;
	}

	setText(text: string): void {
		this.type = "text";
		const newText = text.replace(/[^0-9a-zA-Z:,]+/, "");
		this.text = newText;
	}
	setMessageID(id: string): void {
		this.id = id;
	}
	setVideo(uri: string, duration: number): void {
		this.type = "video";
		this.fileUrl = uri;
		this.fileTime = duration;
	}
	setImage(uri: string, dimensions: string): void {
		this.type = "image";
		this.fileUrl = uri;
		this.fileDimensions = dimensions;
	}
	setAudio(path: string, size: number, time: number): void {
		this.type = "audio";
		this.fileUrl = path;
		this.fileSize = size;
		this.fileTime = time;
	}
	setFileUpload(val: boolean): void {
		this.fileUpload = val;
	}
	setLocation(lat: number, lng: number): void {
		this.location = `${lat},${lng}`;
	}
	setIsVisible(visible: boolean): void {
		this.isVisibleMessage = visible;
	}
	isEmpty(): boolean {
		if (this.creator === "" || this.id === "" || this.creationDate === 0) {
			return true;
		}
		return false;
	}

	public get hasReplyPending(): boolean {
		const arr = this.answerOptions;
		return arr.length > 0;
	}

	analiceReply(msjReply: ChatMessage): ChatMessage | null {
		const arr = this.answerOptions;
		for (const key in arr) {
			const answer = arr[key];
			if (answer.value == msjReply.hideCommand) {
				if (answer.answer) {
					return answer.answer;
				}
			}
		}
		return null;
	}
	exportToUpload(): any {
		if (this.type === "text") {
			return {
				creator: this.creator || "",
				text: this.text || "",
				type: this.type || "",
				creationDate: this.creationDate || 0,
				serverDate: this.serverDate,
				answerOptions: this._answerOptions || "",
				hideCommand: this.hideCommand || "",
			};
		} else if (
			this.type === "image" ||
			this.type === "audio" ||
			this.type === "video"
		) {
			return {
				creator: this.creator,
				fileUrl: this.fileUrl,
				type: this.type,
				creationDate: this.creationDate,
				serverDate: this.serverDate,
				fileUpload: this.fileUpload,
				fileSize: this.fileSize,
				fileTime: this.fileTime,
				fileDimensions: this.fileDimensions,
				answerOptions: this._answerOptions,
				hideCommand: this.hideCommand,
			};
		}
		return null;
	}
}
export default ChatMessage;
