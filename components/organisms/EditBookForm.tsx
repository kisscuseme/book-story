import { getUserPath, updateData } from "@/services/firebase/db";
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
import {
  enterKeyUpEventHandler,
  l,
  onFocusHandler,
} from "@/services/util/util";
import { CustomInput, InputWrapper } from "../atoms/CustomInput";
import { CustomButton } from "../atoms/CustomButton";
import { useEffect, useState } from "react";

interface EditBookFormProps {
  book: BookType;
  componentsTextData: Record<string, string>;
}

export default function EditBookForm({
  book,
  componentsTextData,
}: EditBookFormProps) {
  const {
    register: editBookRegister,
    handleSubmit: editBookHandleSubmit,
    setValue: editBookSetValue,
  } = useForm();
  const [bookList, setBookList] = useRecoilState(bookListState);
  const setShowModal = useSetRecoilState(showModalState);
  const userInfo = useRecoilValue(userInfoState);
  const firstLoading = useRecoilValue(firstLoadingState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    editBookSetValue(`title.${book.id}`, book.title);
    editBookSetValue(`author.${book.id}`, book.author);
  }, []);

  // Book 데이터 수정 시 react query 활용
  const updateBookMutation = useMutation(updateData, {
    onSuccess(data) {
      if (data) {
        setShowModal({
          show: true,
          title: l("Check"),
          content: l("The book has been updated."),
        });
        // 성공 시 참조 오브젝트 데이터 변경 (db에서 데이터를 새로 조회하지 않음)
        const tempBookList = [];
        for (const book of bookList) {
          tempBookList.push({
            id: book.id,
            title: book.title,
            author: book.author,
            timestamp: book.timestamp,
            commentLastVisible: book.commentLastVisible,
            comments: [...(book.comments || [])],
          });
        }
        for (let i = 0; i < tempBookList.length; i++) {
          if (tempBookList[i].id === data?.docId) {
            tempBookList[i].title = data.data.title;
            tempBookList[i].author = data.data.author;
            break;
          }
        }
        setBookList(tempBookList);
        setIsSubmitting(false);
      }
    },
    onError(error) {
      console.log(error);
      setIsSubmitting(false);
    },
  });

  const updateBookHandler = (bookId: string, title: string, author: string) => {
    const path = `${getUserPath()}/${userInfo?.uid}/books`;
    updateBookMutation.mutate({
      path: path,
      docId: bookId,
      data: {
        title: title,
        author: author || "",
      },
    });
  };

  return (
    <Form
      onSubmit={editBookHandleSubmit((data) => {
        if (!isSubmitting) {
          setIsSubmitting(true);
          updateBookHandler(book.id, data.title[book.id], data.author[book.id]);
        }
      })}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.preventDefault();
      }}
    >
      <Row style={{ paddingBottom: "7px", paddingLeft: "10px" }}>
        <DefaultCol style={{ maxWidth: "45%" }}>
          <InputWrapper>
            <CustomInput
              {...editBookRegister(`title.${book.id}`)}
              placeholder={book.title}
              onFocus={onFocusHandler}
              onKeyUp={enterKeyUpEventHandler}
            />
          </InputWrapper>
        </DefaultCol>
        <DefaultCol style={{ minWidth: "35%" }}>
          <InputWrapper>
            <CustomInput
              {...editBookRegister(`author.${book.id}`)}
              placeholder={book.author}
              onFocus={onFocusHandler}
              onKeyUp={enterKeyUpEventHandler}
            />
          </InputWrapper>
        </DefaultCol>
        <DefaultCol style={{ maxWidth: "20%" }}>
          <CustomButton
            backgroundColor="#ffd1d1"
            color="#ff6f6f"
            size="sm"
            align="left"
            type="button"
            onClick={(e) => {
              e.currentTarget.form?.requestSubmit();
            }}
          >
            {firstLoading ? componentsTextData.editButton : l("Edit")}
          </CustomButton>
        </DefaultCol>
      </Row>
    </Form>
  );
}
