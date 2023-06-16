import { getUserPath, insertData } from "@/services/firebase/db";
import { bookListState, showToastState, userInfoState } from "@/states/states";
import { BookType } from "@/types/types";
import { useMutation } from "@tanstack/react-query";
import { Form, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { DefaultCol } from "../atoms/DefaultAtoms";
import { enterKeyUpEventHandler, getErrorMsg, l } from "@/services/util/util";
import { CustomInput } from "../atoms/CustomInput";
import { CustomButton } from "../atoms/CustomButton";
import { useEffect, useState } from "react";
import { getNLBooksData } from "@/services/api/books";

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

  useEffect(() => {
    setFirstLoading(false);
  }, []);

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
      <Row>
        <DefaultCol style={{ maxWidth: "4rem" }}>
          검색 : 
        </DefaultCol>
        <DefaultCol style={{ paddingLeft: "0" }}>
          <CustomInput
            {...register("keyword")}
            placeholder={
              firstLoading
                ? componentsTextData.bookAuthorPlaceholder
                : l("Enter a keyword.")
            }
            clearButton={setValue}
          />
        </DefaultCol>
        <DefaultCol style={{ maxWidth: "5rem", paddingLeft: "0" }}>
          <CustomButton
            backgroundColor="#5b5b5b"
            color="#ffffff"
            size="sm"
            align="right"
            type="button"
            onClick={(e) => {
              const values = getValues();
              getNLBooksData(values.keyword).then((res: any) => {
                const data = res.data.result[0];
                const parser = new DOMParser();
                const title = parser.parseFromString(data.titleInfo, "text/html").querySelector("body")?.textContent;
                const authorHtml= parser.parseFromString(data.authorInfo, "text/html");
                authorHtml.querySelector(".searching_txt")?.remove();
                const author = authorHtml.querySelector("body")?.textContent;
                setValue("title", title);
                setValue("author", author);
              });
            }}
          >
            {firstLoading ? componentsTextData.addButton : l("Search")}
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
          />
        </DefaultCol>
        <DefaultCol style={{ maxWidth: "5rem", paddingLeft: "0" }}>
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
