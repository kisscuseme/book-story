"use client";

import { l } from "@/services/util/util";
import { selectedLanguageState, showModalState } from "@/states/states";
import i18next from "i18next";
import { useSetRecoilState } from "recoil";
import localesJSON from "../../locales/locales.json";
import { CustomDropdown, DropdownDataProps } from "../atoms/CustomDropdown";

export const LanguageSelectorForClient = () => {
  const setSelectedLanguage = useSetRecoilState(selectedLanguageState);
  const setShowModal = useSetRecoilState(showModalState);
  const data: DropdownDataProps[] = [];

  // Dropdown에 사용할 데이터 구성
  const locales = JSON.parse(JSON.stringify(localesJSON));
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

  // 선택한 언어 코드를 전역 상태(변수)에 바인딩
  const selectLanguage = async (langCode: string) => {
    try {
      setSelectedLanguage(langCode);
    } catch (error: any) {
      setShowModal({
        show: true,
        title: l("Error"),
        content: error.message,
      });
    }
  };

  // i18next 라이브러리가 로딩이 되면 Dropdown 컴포넌트 렌더링
  return i18next.language ? (
    <CustomDropdown
      title={`${l("Language")}:`}
      initText={getLanguageName(i18next.language)}
      items={data}
      onClickItemHandler={selectLanguage}
    />
  ) : (
    <></>
  );
};
