import { getUserPath, insertData } from "@/services/firebase/db";
import {
  bookListState,
  firstLoadingState,
  showModalState,
  userInfoState,
} from "@/states/states";
import { BookType } from "@/types/types";
import { useMutation } from "@tanstack/react-query";
import { Form, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { DefaultCol } from "../atoms/DefaultAtoms";
import { enterKeyUpEventHandler, getErrorMsg, l } from "@/services/util/util";
import { CustomInput, InputWrapper } from "../atoms/CustomInput";
import { CustomButton } from "../atoms/CustomButton";
import { useEffect, useState } from "react";

interface AddBookFormProps {
  componentsTextData: Record<string, string>;
}

export default function AddBookForm({ componentsTextData }: AddBookFormProps) {
  const { register, handleSubmit, formState, setValue } = useForm();
  const [bookList, setBookList] = useRecoilState(bookListState);
  const setShowModal = useSetRecoilState(showModalState);
  const userInfo = useRecoilValue(userInfoState);
  const firstLoading = useRecoilValue(firstLoadingState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {}, []);

  // Book 데이터 추가 시 react query 활용
  const insertBookMutation = useMutation(insertData, {
    onSuccess(data) {
      if (data) {
        setValue("title", "");
        setValue("author", "");
        setShowModal({
          show: true,
          title: l("Check"),
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
        <DefaultCol style={{ minWidth: "45%" }}>
          <InputWrapper>
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
            />
          </InputWrapper>
        </DefaultCol>
        <DefaultCol style={{ minWidth: "35%" }}>
          <InputWrapper>
            <CustomInput
              {...register("author")}
              placeholder={
                firstLoading
                  ? componentsTextData.bookAuthorPlaceholder
                  : l("Book author")
              }
              onKeyUp={enterKeyUpEventHandler}
            />
          </InputWrapper>
        </DefaultCol>
        <DefaultCol>
          <CustomButton
            backgroundColor="#5b5b5b"
            color="#ffffff"
            size="sm"
            align="left"
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
          <div style={{ color: "hotpink", paddingTop: "5px" }}>
            {getErrorMsg(formState.errors, "title", "required")}
          </div>
        </DefaultCol>
      </Row>
    </Form>
  );
}
