"use client";

import { setCookie } from "@/services/util/util";
import localesJSON from "../../locales/locales.json";
import langTitleJSON from "../../locales/title.json";
import { CustomDropdown, DropdownDataProps } from "../atoms/CustomDropdown";

export const LanguageSelectorForServer = ({
  langForServer,
}: {
  langForServer: string;
}) => {
  const data: DropdownDataProps[] = [];
  const locales = JSON.parse(JSON.stringify(localesJSON));
  const langTitle = JSON.parse(JSON.stringify(langTitleJSON));

  // Dropdown에 사용할 데이터 구성
  for (const key in locales) {
    data.push({
      key: key,
      href: "#",
      label: locales[key],
    });
  }

  // 언어 코드에 따른 언어 이름 가져오기
  const getLanguageName = (langCode: string) => {
    const result = data.filter((value) => {
      return value.key === langCode;
    });
    if (result.length > 0) return result[0].label;
    else return "";
  };

  // 선택한 언어를 쿠키에 저장 후 페이지 새로고침
  const selectLanguage = (langCode: string) => {
    setCookie("lang", langCode);
    window.location.reload();
  };

  // 서버로부터 받아온 정보로 Dropdown 컴포넌트 바로 구성
  return (
    <CustomDropdown
      title={langTitle[langForServer] + ":"}
      initText={getLanguageName(langForServer)}
      items={data}
      onClickItemHandler={selectLanguage}
    />
  );
};
