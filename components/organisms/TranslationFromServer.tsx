import i18next from "i18next";
import translationKR from "@/locales/kr/translation.json";
import translationEN from "@/locales/en/translation.json";
import localesJSON from "@/locales/locales.json";
import { cookies } from "next/dist/client/components/headers";

// 서버에서 번역 기능을 사용하기 위한 컴포넌트
export default function TranslationFromServer() {
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
    lng: cookies().get("lang")?.value || "kr", //default language
    keySeparator: false,
    interpolation: {
      escapeValue: false,
    },
  });

  return <></>;
}
