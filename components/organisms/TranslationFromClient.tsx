"use client";

import i18next from "i18next";
import translationKR from "@/locales/kr/translation.json";
import translationEN from "@/locales/en/translation.json";
import localesJSON from "@/locales/locales.json";
import { useEffect } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { rerenderDataState, selectedLanguageState } from "@/states/states";
import { getCookie, setCookie } from "@/services/util/util";

// 클라이언트에서 번역 기능을 사용하기 위한 컴포넌트
export default function TranslationFromClient() {
  const [rerenderData, setRerenderData] = useRecoilState(rerenderDataState);
  const selectedLanguage = useRecoilValue(selectedLanguageState);

  useEffect(() => {
    const getLocaleJSON = (locale: string) => {
      if (locale === "kr") return translationKR;
      else return translationEN;
    };

    const locales = localesJSON;
    let resources: any = {};
    for (const key in locales) {
      resources[key] = {
        translation: getLocaleJSON(key),
      };
    }

    i18next.init({
      resources,
      lng: getCookie("lang") || "kr", //default language
      keySeparator: false,
      interpolation: {
        escapeValue: false,
      },
    });
    setRerenderData(!rerenderData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 선택된 언어 코드로 재 설정 후 콜백으로 쿠키 설정 및 재 렌더링을 위한 recoil 전역 상태 바인딩
  useEffect(() => {
    if (selectedLanguage !== null) {
      i18next.changeLanguage(selectedLanguage).then((t) => {
        setCookie("lang", selectedLanguage);
        setRerenderData(!rerenderData);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage]);

  return <></>;
}
