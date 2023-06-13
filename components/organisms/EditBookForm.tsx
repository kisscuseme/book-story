import { deleteData, getUserPath, updateData } from "@/services/firebase/db";
import { bookListState, showModalState, userInfoState } from "@/states/states";
import { BookType } from "@/types/types";
import { useMutation } from "@tanstack/react-query";
import { Form, Row } from "react-bootstrap";
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
import { useEffect, useState } from "react";
import { CustomInput } from "../atoms/CustomInput";

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
  const userInfo = useRecoilValue(userInfoState);
  const [firstLoading, setFirstLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setValue("title", book.title);
    setValue("author", book.author);
    setFirstLoading(false);
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

  // 데이터 삭제 시 react query 활용
  const deleteBookMutation = useMutation(deleteData, {
    onSuccess(data) {
      if (data) {
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
    >
      <Row style={{ paddingLeft: "20px", marginLeft: "0px" }}>
        <DefaultCol style={{ minWidth: "30%", paddingLeft: "0px" }}>
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
        <DefaultCol
          style={{ maxWidth: "25%", paddingLeft: "0px", paddingRight: "5px" }}
        >
          <CustomInput
            {...register("author")}
            placeholder={book.author}
            onFocus={onFocusHandler}
            onKeyUp={enterKeyUpEventHandler}
            clearButton={setValue}
          />
        </DefaultCol>
        <DefaultCol
          style={{
            maxWidth: "40%",
            display: "flex",
            justifyContent: "space-evenly",
            paddingLeft: "0px",
          }}
        >
          <CustomButton
            backgroundColor="#d1d1d1"
            color="#767676"
            size="sm"
            align="left"
            type="button"
            onClick={(e) => {
              e.currentTarget.form?.requestSubmit();
            }}
          >
            {firstLoading ? componentsTextData.editButton : l("Edit")}
          </CustomButton>
          <CustomButton
            backgroundColor="#ffd1d1"
            color="#ff6f6f"
            size="sm"
            align="left"
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
        </DefaultCol>
      </Row>
      <Row>
        <DefaultCol>
          <div style={{ color: "hotpink", paddingTop: "5px" }}>
            {getErrorMsg(formState.errors, "title", "required") ||
              getErrorMsg(formState.errors, "title", "validate")}
          </div>
        </DefaultCol>
      </Row>
    </Form>
  );
}
