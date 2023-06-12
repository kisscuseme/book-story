import { t } from "i18next";
import CryptoJS from "crypto-js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { FieldErrors, FieldValues, useForm } from "react-hook-form";
import { FocusEvent, KeyboardEvent } from "react";

// 입력 받은 날짜로 요일 계산
const getDay = (date: string) => {
  var yyyyMMdd = getReformDate(date, "").substring(0, 8);
  var sYear = yyyyMMdd.substring(0, 4);
  var sMonth = yyyyMMdd.substring(4, 6);
  var sDate = yyyyMMdd.substring(6, 8);
  var targetDate = new Date(Number(sYear), Number(sMonth) - 1, Number(sDate));
  var week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return week[targetDate.getDay()];
};

// 입력 받은 날짜 형식 변경
const getReformDate = (date: string, dvsn: string) => {
  if (date) {
    let reformDate = date
      .replace("년", dvsn)
      .replace("월", dvsn)
      .replace("일", " ");
    reformDate = reformDate.replaceAll(".", dvsn);
    reformDate = reformDate.replaceAll("-", dvsn);
    if (dvsn === "-") reformDate = reformDate.substring(0, 10);
    if (dvsn === ".") reformDate = reformDate.substring(0, 10);
    if (dvsn === "") reformDate = reformDate.substring(0, 8);
    return reformDate;
  } else {
    return "";
  }
};

// 오늘 날짜 리턴
const getToday = () => {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  const now = dayjs().tz("Asia/Seoul");
  const year = now.year().toString();
  const month = (now.month() + 1).toString();
  const date = now.date().toString();
  const today =
    year + "-" + ("0" + month).slice(-2, 3) + "-" + ("0" + date).slice(-2, 3);
  return today;
};

// 현재 년도 기준으로 년도 list 생성
const getYearList = () => {
  const yearList: {
    key: string;
    href: string;
    label: string;
  }[] = [];
  const now = new Date();
  const year: number = now.getFullYear();
  const limitRange = 3;
  for (let i = -1 * limitRange; i < limitRange + 1; i++) {
    yearList.push({
      key: String(year + i),
      href: "#",
      label:
        String(year + i) +
        (i === -1 * limitRange ? "↓" : i === limitRange ? "↑" : ""),
    });
  }
  yearList.reverse();
  return yearList;
};

// 이메일 형식 체크
const emailRegEx =
  /^[A-Za-z0-9]([-_.]?[A-Za-z0-9])*@[A-Za-z0-9]([-_.]?[A-Za-z0-9])*\.[A-Za-z]{2,3}$/;
const checkEmail = (email: string) => {
  return emailRegEx.test(email);
};

// 비밀번호 형식 체크
const passwordRegEx =
  /^[A-Za-z0-9\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]{6,20}$/;
const checkPassword = (password: string) => {
  return passwordRegEx.test(password);
};

// 텍스트 번역
const l = (translationKey: string, options?: object) => {
  return t(translationKey || "", options ? options : {}) || translationKey;
};

// where 조건 년도 범위 계산
const getYearRange = (selectedYear: string) => {
  const yearList = getYearList();
  let fromYear = selectedYear;
  let toYear = selectedYear + "\uf8ff";

  if (selectedYear === yearList[yearList.length - 1].key) {
    fromYear = "0000";
  } else if (selectedYear === yearList[0].key) {
    toYear = "9999" + "\uf8ff";
  }
  return {
    fromYear: fromYear,
    toYear: toYear,
  };
};

// 쿠키 set
const setCookie = (
  name: string,
  value: string,
  unixTime: number = new Date(9999, 12, 31).getTime()
) => {
  var date = new Date();
  date.setTime(date.getTime() + unixTime);
  document.cookie =
    encodeURIComponent(name) +
    "=" +
    encodeURIComponent(value) +
    ";expires=" +
    date.toUTCString() +
    ";path=/";
};

// 쿠키 get
const getCookie = (name: string) => {
  var value = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
  return value ? decodeURIComponent(value[2]) : null;
};

// 쿠키 delete
const deleteCookie = (name: string) => {
  document.cookie =
    encodeURIComponent(name) + "=; expires=Thu, 01 JAN 1999 00:00:10 GMT";
};

// 암복호화 사용 여부
const useEncrypt = true;

// 시크릿 키 생성
const getSecretKey = (key: string) => {
  return CryptoJS.SHA256(key).toString();
};

// 암호화
const encrypt = (payload: string, key: string) => {
  try {
    if (!useEncrypt || !key) {
      // console.log("No Key.");
      return payload;
    }
    const encrypted = CryptoJS.AES.encrypt(
      payload,
      getSecretKey(key)
    ).toString();
    return encrypted;
  } catch (e) {
    // console.log("Encryption error occur : ", e);
    return payload;
  }
};

// 복호화
const decrypt = (encrypted: string, key: string) => {
  try {
    if (!useEncrypt || !key) {
      // console.log("No Key.");
      return encrypted;
    }
    const decrypted_bytes = CryptoJS.AES.decrypt(encrypted, getSecretKey(key));
    const decrypted = decrypted_bytes.toString(CryptoJS.enc.Utf8);
    return decrypted.trim() || encrypted;
  } catch (e) {
    // console.log("Decryption error occur : ", e);
    return encrypted;
  }
};

const getErrorMsg = (
  errors: FieldErrors<FieldValues>,
  value: string,
  type: string
) => {
  if (errors[value]?.type === type) return errors[value]?.message as string;
  else return null;
};

// 엔터 입력 시 submit 버튼 클릭 효과
const enterKeyUpEventHandler = (e: KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter") {
    e.currentTarget.form?.requestSubmit();
  }
};

// focus 시 커서 맨 뒤로
const onFocusHandler = (e: FocusEvent<HTMLInputElement>) => {
  const value = e.currentTarget?.value;
  const target = e.currentTarget;
  e.currentTarget.value = "";
  setTimeout(() => {
    target.value = value;
  }, 100);
};

export {
  emailRegEx,
  checkEmail,
  passwordRegEx,
  checkPassword,
  getDay,
  getReformDate,
  getToday,
  getYearList,
  l,
  getYearRange,
  getCookie,
  setCookie,
  deleteCookie,
  encrypt,
  decrypt,
  getErrorMsg,
  enterKeyUpEventHandler,
  onFocusHandler,
};
