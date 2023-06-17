import { getUserPath, insertData } from "@/services/firebase/db";
import { bookListState, showToastState, userInfoState } from "@/states/states";
import { BookType } from "@/types/types";
import { useMutation } from "@tanstack/react-query";
import { Form, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { DefaultCol } from "../atoms/DefaultAtoms";
import {
  enterKeyUpEventHandler,
  getErrorMsg,
  getTextfromHtmlString,
  l,
  onFocusHandler,
} from "@/services/util/util";
import { CustomInput } from "../atoms/CustomInput";
import { CustomButton } from "../atoms/CustomButton";
import { useEffect, useState } from "react";
import { getNLBooksData } from "@/services/api/books";
import { CustomDropdown, DropdownDataProps } from "../atoms/CustomDropdown";

interface AddBookFormProps {
  componentsTextData: Record<string, string>;
}

export default function AddBookForm({ componentsTextData }: AddBookFormProps) {
  const { register, handleSubmit, formState, setValue, getValues } = useForm();
  const [bookList, setBookList] = useRecoilState(bookListState);
  const setShowToast = useSetRecoilState(showToastState);
  const userInfo = useRecoilValue(userInfoState);
  const [firstLoading, setFirstLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchList, setSearchList] = useState<DropdownDataProps[]>([]);
  const [keyword, setKeyword] = useState("");
  let debounce: NodeJS.Timeout;

  useEffect(() => {
    setFirstLoading(false);
  }, []);

  useEffect(() => {
    if (keyword) {
      debounce = setTimeout(() => {
        const tempSearchList: DropdownDataProps[] = [];
        getNLBooksData(keyword).then((res: any) => {
          res.map((data: any) => {
            tempSearchList.push({
              key: tempSearchList.length.toString(),
              label: `${data.title}${data.author && (" / " + data.author)}`,
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
    }
  }, [keyword]);

  // Book 데이터 추가 시 react query 활용
  const insertBookMutation = useMutation(insertData, {
    onSuccess(data) {
      if (data) {
        setShowToast({
          show: true,
          content: l("A book has been added."),
        });
        // 성공 시 참조 오브젝트에 데이터 추가 (db에서 데이터를 새로 조회하지 않음)
        const tempBookList = [
          {
            id: data.docId,
            ...data.data,
          } as BookType,
          ...bookList,
        ];
        setBookList(tempBookList);
        setValue("title", "");
        setValue("author", "");
        setIsSubmitting(false);
      }
    },
    onError(error) {
      console.log(error);
      setIsSubmitting(false);
    },
  });

  const insertBookHandler = (title: string, author: string) => {
    const path = `${getUserPath()}/${userInfo?.uid}/books`;
    insertBookMutation.mutate({
      path: path,
      data: {
        title: title,
        author: author,
      },
    });
  };

  return (
    <Form
      onSubmit={handleSubmit((data) => {
        if (!isSubmitting) {
          setIsSubmitting(true);
          insertBookHandler(data.title, data.author);
        }
      })}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.preventDefault();
      }}
    >
      <Row style={{paddingBottom: "0.5rem"}}>
        <DefaultCol style={{ maxWidth: "5rem" }}>{firstLoading ? componentsTextData.searchTitle : l("Search")} :</DefaultCol>
        <DefaultCol style={{ paddingLeft: "0" }}>
          <CustomDropdown
            id="search-dropdown"
            items={searchList}
            initText=""
            align="left"
            onClickItemHandler={(label) => {
              setValue("title", label.title);
              setValue("author", label.author);
              setValue("keyword", "");
              setKeyword("");
            }}
            customToggle={
              <CustomInput
                {...register("keyword")}
                placeholder={
                  firstLoading
                    ? componentsTextData.searchKeywordPlaceholder
                    : l("Enter a keyword.")
                }
                clearButton={(field, value) => {
                  setValue(field, value);
                  setKeyword("");
                }}
                onChange={(e) => {
                  setKeyword(e.target.value);
                }}
                onFocus={onFocusHandler}
              />
            }
          />
        </DefaultCol>
      </Row>
      <Row>
        <DefaultCol>
          <div style={{ color: "hotpink", paddingTop: "0.3rem" }}>
            {getErrorMsg(formState.errors, "title", "required")}
          </div>
        </DefaultCol>
      </Row>
      <Row>
        <DefaultCol style={{ minWidth: "45%" }}>
          <CustomInput
            {...register("title", {
              required: {
                value: true,
                message: l("Please enter the title of the book."),
              },
            })}
            placeholder={
              firstLoading
                ? componentsTextData.bookTitlePlaceholder
                : l("Book Title")
            }
            onKeyUp={enterKeyUpEventHandler}
            clearButton={setValue}
            onFocus={onFocusHandler}
          />
        </DefaultCol>
        <DefaultCol style={{ minWidth: "35%" }}>
          <CustomInput
            {...register("author")}
            placeholder={
              firstLoading
                ? componentsTextData.bookAuthorPlaceholder
                : l("Book author")
            }
            onKeyUp={enterKeyUpEventHandler}
            clearButton={setValue}
            onFocus={onFocusHandler}
          />
        </DefaultCol>
        <DefaultCol style={{ maxWidth: "3.5rem", paddingLeft: "0" }}>
          <CustomButton
            backgroundColor="#5b5b5b"
            color="#ffffff"
            size="sm"
            align="right"
            type="button"
            onClick={(e) => {
              e.currentTarget.form?.requestSubmit();
            }}
          >
            {firstLoading ? componentsTextData.addButton : l("Add")}
          </CustomButton>
        </DefaultCol>
      </Row>
      <Row>
        <DefaultCol>
          <div style={{ color: "hotpink", paddingTop: "0.3rem" }}>
            {getErrorMsg(formState.errors, "title", "required")}
          </div>
        </DefaultCol>
      </Row>
    </Form>
  );
}
