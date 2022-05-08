import Dates from "./Dates";
import GeneralUtils from "./GeneralUtils";
import Objects from "./Objects";

const TAG = "UTILS";
export interface fileInfo {
  fileName: string;
  path: string;
}

class Utils extends GeneralUtils {
  dates: Dates;
  objects: Objects;

  constructor() {
    super();
    this.dates = new Dates();
    this.objects = new Objects();
  }
  getRandomNumber(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }
  rulethree(valueA: number, valueAEqual: number, valueB: number) {
    //si valueA seria valueAEqual entonces valueB seria... return
    return (valueAEqual * valueB) / valueA;
  }
  timeOut(milisecs: number) {
    return new Promise<boolean>((resolve, reject) => {
      try {
        setTimeout(() => {
          resolve(true);
        }, milisecs);
      } catch (error) {
        reject(null);
      }
    });
  }
  openUrl(url: string) {
    const w: any = window;
    w.open(url, "_blank").focus();
  }
  isNum(val: any) {
    if (!isNaN(val)) return true;
    return false;
  }
  getNameLastName(name: string) {
    const obj = {
      name: "",
      lastName: "",
    };
    if (name.includes(" ")) {
      const ss = name.split(" ");
      obj.name = ss[0];
      obj.lastName = ss[1];
      return obj;
    }
    obj.name = name;
    return obj;
  }
  getListSeparator_bis() {
    const list = ["a", "b"];
    const s = list.toLocaleString().charAt(1);
    return s;
  }
  getRegexTextCoincidence(text: string) {
    const words = [...text.split(" ")];
    return new RegExp(words.join("|"));
  }
  includes(str: string, value: string) {
    if (str.indexOf(value) !== -1) {
      return true;
    }
    return false;
  }
}

export default new Utils();
