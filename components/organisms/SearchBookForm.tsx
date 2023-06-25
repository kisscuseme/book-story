import { useEffect, useState } from "react";
import { CustomDropdown, DropdownDataProps } from "../atoms/CustomDropdown";
import { getNLBooksData } from "@/services/api/books";
import { getTextfromHtmlString, onFocusHandler } from "@/services/util/util";
import { UseFormRegister, UseFormSetValue } from "react-hook-form";
import { CustomInput } from "../atoms/CustomInput";
import { BookType } from "@/types/types";
import { useRecoilState } from "recoil";
import { allowSearchState, rerenderDataState } from "@/states/states";

interface SearchBookFormProps {
  book?: BookType;
  setValue: UseFormSetValue<any>;
  register: UseFormRegister<any>;
  name: string;
  placeholder?: string;
  searchDisabled?: boolean;
}

export default function SearchBookForm({
  book,
  setValue,
  register,
  name,
  placeholder,
  searchDisabled = false,
}: SearchBookFormProps) {
  const [searchList, setSearchList] = useState<DropdownDataProps[]>([]);
  const [keyword, setKeyword] = useState("");
  let debounce: NodeJS.Timeout;
  const [rerenderData, setRerenderData] = useRecoilState(rerenderDataState);
  const searchBookForm = register(name);
  const [allowSearch, setAllowSearch] = useRecoilState(allowSearchState);
  const [continueSearch, setContinueSearch] = useState(false);

  useEffect(() => {
    setContinueSearch(false);
  }, []);

  useEffect(() => {
    if (!searchDisabled && allowSearch && continueSearch && keyword) {
      debounce = setTimeout(() => {
        const tempSearchList: DropdownDataProps[] = [];
        getNLBooksData(keyword).then((res: any) => {
          if (res.length > 0) {
            tempSearchList.push({
              key: "-1",
              label: `직접 입력`,
            });
            res.map((data: any) => {
              tempSearchList.push({
                key: tempSearchList.length.toString(),
                label: `${data.title}${data.author && " / " + data.author}`,
                refData: {
                  title: getTextfromHtmlString(data.title),
                  author: getTextfromHtmlString(data.author),
                },
              });
            });
          }
          setSearchList(tempSearchList);
        });
      }, 200);
    } else {
      setSearchList([]);
    }

    // 이전 작업 Clean
    return () => {
      clearTimeout(debounce);
    };
  }, [keyword]);

  useEffect(() => {
    if (allowSearch === false && searchList.length > 0) setSearchList([]);
  }, [searchList]);

  return (
    <CustomDropdown
      id={`search-dropdown${"-" + name}${book ? "-" + book?.id : ""}`}
      items={searchList}
      initText=""
      align="left"
      onClickItemHandler={(label) => {
        if (label !== "-1") {
          setValue("title", label.title);
          setValue("author", label.author);
        }
        setKeyword("");
        setRerenderData(!rerenderData);
        if (!searchDisabled) {
          setContinueSearch(false);
          setAllowSearch(false);
        }
      }}
      customToggle={
        <CustomInput
          {...searchBookForm}
          ref={(target) => {
            searchBookForm.ref(target);
            if (target?.value !== keyword) setKeyword(target?.value || "");
            if (!searchDisabled && target?.value === "")
              setContinueSearch(true);
          }}
          placeholder={placeholder}
          clearButton={(field: string, value: string) => {
            setValue(field, value);
            setKeyword("");
          }}
          onChange={(e) => {
            setKeyword(e.target.value);
            if (!searchDisabled) setAllowSearch(true);
          }}
          onFocus={onFocusHandler}
        />
      }
    />
  );
}
