import { useEffect, useState } from "react";
import { CustomDropdown, DropdownDataProps } from "../atoms/CustomDropdown";
import { getNLBooksData } from "@/services/api/books";
import { getTextfromHtmlString, l, onFocusHandler } from "@/services/util/util";
import { FieldValues, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { CustomInput } from "../atoms/CustomInput";
import { BookType } from "@/types/types";
import { useRecoilState } from "recoil";
import { rerenderDataState } from "@/states/states";

interface SearchBookFormProps {
  book?: BookType;
  setValue: UseFormSetValue<FieldValues>;
  register: UseFormRegister<FieldValues>;
  componentsTextData: Record<string, string>;
}

export default function SearchBookForm({
  book,
  setValue,
  register,
  componentsTextData,
}: SearchBookFormProps) {
  const [searchList, setSearchList] = useState<DropdownDataProps[]>([]);
  const [keyword, setKeyword] = useState("");
  let debounce: NodeJS.Timeout;
  const [firstLoading, setFirstLoading] = useState(true);
  const [rerenderData, setRerenderData] = useRecoilState(rerenderDataState);

  useEffect(() => {
    setFirstLoading(false);
  });

  useEffect(() => {
    if (keyword) {
      debounce = setTimeout(() => {
        const tempSearchList: DropdownDataProps[] = [];
        getNLBooksData(keyword).then((res: any) => {
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
          setSearchList(tempSearchList);
        });
      }, 500);
    } else {
      setSearchList([]);
    }

    // 이전 작업 Clean
    return () => {
      clearTimeout(debounce);
    };
  }, [keyword]);

  return (
    <CustomDropdown
      id={`search-dropdown${book ? "-" + book?.id : ""}`}
      items={searchList}
      initText=""
      align="left"
      onClickItemHandler={(label) => {
        setValue("title", label.title);
        setValue("author", label.author);
        setValue("keyword", "");
        setKeyword("");
        setRerenderData(!rerenderData);
      }}
      customToggle={
        <CustomInput
          {...register("keyword")}
          placeholder={
            firstLoading
              ? componentsTextData.searchKeywordPlaceholder
              : `${l("Please enter your keywords.")} (${l("book title or author")})`
          }
          clearButton={(field, value) => {
            setValue(field, value);
            setKeyword("");
          }}
          onChange={(e) => {
            setKeyword(e.target.value);
          }}
          onFocus={onFocusHandler}
          placeholderColor="#cc96ff"
        />
      }
    />
  );
}
