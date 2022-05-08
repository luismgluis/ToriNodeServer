class Dates {
	constructor() {
		/* */
	}
	dateToString(
		date: Date,
		withHour = false,
		withSec = false,
		withMonthName = false
	): string {
		const a = new Date(date);
		const months = [
			"Ene",
			"Feb",
			"Mar",
			"Abr",
			"May",
			"Jun",
			"Jul",
			"Ago",
			"Sep",
			"Oct",
			"Nov",
			"Dic",
		];
		const year = a.getFullYear();
		const MONTH = months[a.getMonth()];
		let month = `${a.getMonth() + 1}`;
		const day = a.getDate();
		const hour = a.getHours();
		const min = a.getMinutes();
		const sec = a.getSeconds();

		if (withMonthName) {
			month = MONTH;
		}

		let time = day + "/" + month + "/" + year;
		if (withHour) {
			time += " " + hour + ":" + min;
		}
		if (withSec) {
			time += "." + sec;
		}
		return time;
	}
	unixToDate(UNIX_timestamp: number): Date {
		return new Date(UNIX_timestamp * 1000);
	}
	unixToString(
		UNIX_timestamp: number,
		withHour = false,
		withSec = false,
		withMonthName = false
	): string {
		const a = this.unixToDate(UNIX_timestamp);
		const time = this.dateToString(a, withHour, withSec, withMonthName);
		return time;
	}
	dateToDaysHoursNowUnix(date1Unix: number, withSeconds: boolean = false) {
		const date1 = this.unixToDate(date1Unix);
		return this.dateToDaysHours(date1, new Date(), withSeconds);
	}
	dateToDaysHoursNow(date1: Date, withSeconds: boolean = false) {
		return this.dateToDaysHours(date1, new Date(), withSeconds);
	}
	dateToDaysHours(date1: Date, date2: Date, withSeconds: boolean = false) {
		const unixDate1 = this.dateToUnix(date1);
		const unixDate2 = this.dateToUnix(date2);
		const day = 86400; //secs
		const hour = 3600;
		const minute = 60;

		let distance = unixDate2 - unixDate1;
		const res = {
			days: 0,
			hours: 0,
			minutes: 0,
			seconds: 0,
			text: "",
			distance: distance,
		};
		while (distance > 0) {
			if (distance >= day) {
				distance -= day;
				res.days++;
			} else if (distance >= hour) {
				distance -= hour;
				res.hours++;
			} else if (distance >= minute) {
				distance -= minute;
				res.minutes++;
			} else {
				res.seconds = distance;
				distance -= distance;
			}
		}
		if (res.days > 0) {
			res.text = `${res.days}d ${res.hours}h ${res.minutes}m`;
		} else if (res.hours > 0) {
			res.text = `${res.hours}h ${res.minutes}m`;
		} else if (res.minutes > 0) {
			res.text = `${res.minutes}m`;
		}

		if (res.text === "") {
			res.text = `${res.seconds}s`;
		} else if (withSeconds) res.text += ` ${res.seconds}`;

		return res;
	}
	dateNowString(
		withHour = false,
		withSec = false,
		withMonthName = false
	): string {
		const u = this.dateNowUnix();
		const a = this.unixToDate(u);
		return this.dateToString(a, withHour, withSec, withMonthName);
	}
	dateStringInputToDateUnix(str: string) {
		console.log(str);
		if (str === "") return null;
		const arr = str.split("-");
		const date = new Date(
			Number(arr[0]),
			Number(arr[1]) - 1,
			Number(arr[2])
		);
		console.log(date);
		return this.dateToUnix(date);
	}
	dateStringInputToString(str: string) {
		const d = this.dateStringInputToDateUnix(str);
		if (d) return this.unixToString(d);
		return "";
	}
	dateNow(): Date {
		return new Date();
	}
	dateNowUnix(): number {
		console.log(this.dateToUnix(new Date()));
		// const s = new Date().toLocaleString("en-US", {
		//   timeZone: "America/Bogota",
		// // });
		// console.log(s);
		return this.dateToUnix(new Date());
	}
	dateToInput() {
		const a = this.dateNow().toISOString().substr(0, 10);
		let s = this.dateNow()
			.toLocaleString("en-US", {
				timeZone: "America/Bogota",
			})
			.substr(0, 10);
		if (s.includes(",")) s = s.split(",")[0];
		console.log(s, a);
		const d = this.dateNow();
		const m =
			d.getMonth() + 1 <= 9 ? `0${d.getMonth() + 1}` : d.getMonth() + 1;
		const day = d.getDate() <= 9 ? `0${d.getDate()}` : d.getDate();

		const n = `${d.getFullYear()}-${m}-${day}`;
		return n;
	}
	dateToUnix(date: Date): number {
		return Math.round(+date / 1000);
	}
	secsToTime(valTime: number): string {
		if (valTime) {
			let secs = parseInt("" + valTime / 1000, 10);
			const mins = (() => {
				if (secs > 59) {
					secs -= 59;
					return 1;
				}
				return 0;
			})();
			return `${mins > 9 ? mins : "0" + mins}:${
				secs > 9 ? secs : "0" + secs
			}`;
		}
		return "00:00";
	}
}
export default Dates;
