import { deleteData, getUserPath, updateData } from "@/services/firebase/db";
import {
  bookListState,
  showModalState,
  showToastState,
  userInfoState,
} from "@/states/states";
import { BookType } from "@/types/types";
import { useMutation } from "@tanstack/react-query";
import { Button, Form, Row, useAccordionButton } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { DefaultCol } from "../atoms/DefaultAtoms";
import {
  enterKeyUpEventHandler,
  getErrorMsg,
  l,
  onFocusHandler,
} from "@/services/util/util";
import { CustomButton } from "../atoms/CustomButton";
import { SyntheticEvent, useEffect, useRef, useState } from "react";
import { CustomInput } from "../atoms/CustomInput";
import SearchBookForm from "./SearchBookForm";

interface EditBookFormProps {
  book: BookType;
  componentsTextData: Record<string, string>;
}

export default function EditBookForm({
  book,
  componentsTextData,
}: EditBookFormProps) {
  const { register, handleSubmit, setValue, formState, getValues } = useForm();
  const [bookList, setBookList] = useRecoilState(bookListState);
  const setShowModal = useSetRecoilState(showModalState);
  const setShowToast = useSetRecoilState(showToastState);
  const userInfo = useRecoilValue(userInfoState);
  const [firstLoading, setFirstLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const closeAccordion = useAccordionButton(book.id || "");
  const closeAccordionButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setValue("title", book.title);
    setValue("author", book.author);
    setFirstLoading(false);
  }, []);

  // Book 데이터 수정 시 react query 활용
  const updateBookMutation = useMutation(updateData, {
    onSuccess(data) {
      if (data) {
        setShowToast({
          show: true,
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
        closeAccordionButtonRef.current?.click();
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

  // 데이터 삭제 시 react query 활용
  const deleteBookMutation = useMutation(deleteData, {
    onSuccess(data) {
      if (data) {
        setShowToast({
          show: true,
          content: l("The book has been deleted."),
        });
        // 데이터 삭제 후 참조 오브젝트에서 제거하기 위한 로직 (db를 재 조회하지 않음)
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
        tempBookList.sort((a, b) => {
          if (a === null || b === null) return 0;
          else {
            let numA = Number(a.timestamp);
            let numB = Number(b.timestamp);
            if (b.id === data.docId) return -1;
            else return numB - numA;
          }
        });
        tempBookList.pop();
        setBookList(tempBookList);
        setIsSubmitting(false);
      }
    },
  });

  const deleteBookHandler = (bookId: string) => {
    const path = `${getUserPath()}/${userInfo?.uid}/books`;
    const confirmPath = `${getUserPath()}/${
      userInfo?.uid
    }/books/${bookId}/comments`;
    deleteBookMutation.mutate({
      path: path,
      docId: bookId,
      confirmPath: confirmPath,
    });
  };

  return (
    <Form
      onSubmit={handleSubmit((data) => {
        if (!isSubmitting) {
          setIsSubmitting(true);
          updateBookHandler(book.id, data.title, data.author);
        }
      })}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.preventDefault();
      }}
      style={{ paddingLeft: "0.5rem" }}
    >
      <Row>
        <DefaultCol style={{ paddingBottom: "0.5rem" }}>
          <SearchBookForm
            setValue={setValue}
            register={register}
            componentsTextData={componentsTextData}
            book={book}
          />
        </DefaultCol>
      </Row>
      <Row>
        <DefaultCol style={{ paddingBottom: "0.5rem" }}>
          <CustomInput
            {...register("title", {
              required: {
                value: true,
                message: l("Please enter the title of the book."),
              },
              validate: (value) => {
                const author = getValues()["author"];
                if (value !== book.title || author !== book.author) return true;
                else return l("Everything is the same.");
              },
            })}
            placeholder={book.title}
            onFocus={onFocusHandler}
            onKeyUp={enterKeyUpEventHandler}
            clearButton={setValue}
          />
        </DefaultCol>
      </Row>
      <Row style={{ paddingBottom: "0.5rem" }}>
        <DefaultCol>
          <CustomInput
            {...register("author")}
            placeholder={
              book.author ||
              `${l("Book author")} (${l("Enter directly")})` ||
              componentsTextData.bookAuthorPlaceholder
            }
            onFocus={onFocusHandler}
            onKeyUp={enterKeyUpEventHandler}
            clearButton={setValue}
          />
        </DefaultCol>
        <DefaultCol
          style={{
            paddingLeft: "0",
            maxWidth: "8rem",
          }}
        >
          <CustomButton
            backgroundColor="#ffd1d1"
            color="#ff6f6f"
            size="sm"
            align="right"
            type="button"
            onClick={(e) => {
              setShowModal({
                show: true,
                title: l("check"),
                content: l("Are you sure you want to delete?"),
                confirm: () => {
                  if (!isSubmitting) {
                    setIsSubmitting(true);
                    deleteBookHandler(book.id);
                  }
                },
              });
            }}
          >
            {firstLoading ? componentsTextData.editButton : l("Delete")}
          </CustomButton>
          <CustomButton
            backgroundColor="#d1d1d1"
            color="#767676"
            size="sm"
            align="right"
            style={{ marginRight: "0.7rem" }}
            type="button"
            onClick={(e) => {
              e.currentTarget.form?.requestSubmit();
            }}
          >
            {firstLoading ? componentsTextData.editButton : l("Edit")}
          </CustomButton>
        </DefaultCol>
      </Row>
      <Row>
        <DefaultCol>
          <div style={{ color: "hotpink", paddingTop: "0.3rem" }}>
            {getErrorMsg(formState.errors, "title", "required") ||
              getErrorMsg(formState.errors, "title", "validate")}
          </div>
        </DefaultCol>
      </Row>
      <div className="hidden-button">
        <Button
          ref={closeAccordionButtonRef}
          onClick={(e: SyntheticEvent<HTMLButtonElement, Event>) => {
            closeAccordion(e);
          }}
        >
          close accordion hidden button
        </Button>
      </div>
    </Form>
  );
}
