import { deleteData, getUserPath, updateData } from "@/services/firebase/db";
import {
  bookListState,
  showModalState,
  showToastState,
  userInfoState,
} from "@/states/states";
import { BookType, CommentType } from "@/types/types";
import { useMutation } from "@tanstack/react-query";
import { Button, Form, Row, useAccordionButton } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { DefaultCol } from "../atoms/DefaultAtoms";
import { CustomDropdown } from "../atoms/CustomDropdown";
import {
  decrypt,
  encrypt,
  enterKeyUpEventHandler,
  getErrorMsg,
  l,
  onFocusHandler,
} from "@/services/util/util";
import { CustomButton } from "../atoms/CustomButton";
import { SyntheticEvent, useEffect, useRef, useState } from "react";
import { CustomInput } from "../atoms/CustomInput";

interface EditCommentFormProps {
  book: BookType;
  comment: CommentType;
  componentsTextData: Record<string, string>;
}

export default function EditCommentForm({
  book,
  comment,
  componentsTextData,
}: EditCommentFormProps) {
  const { register, handleSubmit, setValue, formState } = useForm();
  const [bookList, setBookList] = useRecoilState(bookListState);
  const setShowModal = useSetRecoilState(showModalState);
  const setShowToast = useSetRecoilState(showToastState);
  const userInfo = useRecoilValue(userInfoState);
  const [commentType, setCommentType] = useState(comment.type);
  const [firstLoading, setFirstLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const closeAccordion = useAccordionButton(`${book.id}.${comment.id}` || "");
  const closeAccordionButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setValue("text", comment.text);
    setFirstLoading(false);
  }, []);

  // Comment 데이터 수정 시 react query 활용
  const updateCommentMutation = useMutation(updateData, {
    onSuccess(data) {
      if (data) {
        setShowToast({
          show: true,
          content: l("The comment has been updated."),
        });
        // 성공 시 참조 오브젝트에 데이터 추가 (db에서 데이터를 새로 조회하지 않음)
        const bookId = data.path.split("/")[5];
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
        const comment = {
          id: data.docId,
          type: data.data.type,
          text: decrypt(data.data.text, userInfo?.uid + data.docId),
        };
        for (let i = 0; i < tempBookList.length; i++) {
          if (tempBookList[i].id === bookId) {
            if (tempBookList[i].comments) {
              const tempCommentList = [...(tempBookList[i].comments || [])];
              for (let j = 0; j < tempCommentList.length; j++) {
                if (tempCommentList[j].id === data.docId) {
                  tempCommentList[j] = comment;
                  tempBookList[i].comments = tempCommentList;
                  break;
                }
              }
            }
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

  const updateCommentHandler = (
    bookId: string,
    commentId: string,
    type: string,
    text: string
  ) => {
    const path = `${getUserPath()}/${userInfo?.uid}/books/${bookId}/comments`;
    updateCommentMutation.mutate({
      path: path,
      docId: commentId,
      data: {
        type: type,
        text: encrypt(text, userInfo?.uid + commentId),
      },
    });
  };

  // 데이터 삭제 시 react query 활용
  const deleteCommentMutation = useMutation(deleteData, {
    onSuccess(data) {
      if (data) {
        setShowToast({
          show: true,
          content: l("The comment has been deleted."),
        });
        // 데이터 삭제 후 참조 오브젝트에서 제거하기 위한 로직 (db를 재 조회하지 않음)
        const bookId = data.path.split("/")[5];
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
          for (let i = 0; i < tempBookList.length; i++) {
            if (tempBookList[i].id === bookId) {
              if (tempBookList[i].comments.length > 0) {
                for (let j = 0; j < tempBookList[i].comments.length; j++) {
                  if (tempBookList[i].comments[j].id === data.docId) {
                    console.log(tempBookList[i].comments);
                    tempBookList[i].comments.sort((a, b) => {
                      if (a === null || b === null) return 0;
                      else {
                        let numA = Number(a.timestamp);
                        let numB = Number(b.timestamp);
                        if (b.id === data.docId) return -1;
                        else return numB - numA;
                      }
                    });
                    tempBookList[i].comments.pop();
                  }
                }
              }
            }
          }
        }
        setBookList(tempBookList);
        setIsSubmitting(false);
      }
    },
  });

  const deleteCommentHandler = (bookId: string, commentId: string) => {
    const path = `${getUserPath()}/${userInfo?.uid}/books/${bookId}/comments`;
    deleteCommentMutation.mutate({
      path: path,
      docId: commentId,
    });
  };

  return (
    <Form
      onSubmit={handleSubmit((data) => {
        if (!isSubmitting) {
          setIsSubmitting(true);
          updateCommentHandler(book.id, comment.id, commentType, data.text);
        }
      })}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.preventDefault();
      }}
      style={{
        paddingLeft: "0.5rem",
      }}
    >
      <Row style={{ marginLeft: "0" }}>
        <DefaultCol style={{ maxWidth: "4.9rem", paddingLeft: "0" }}>
          <CustomDropdown
            onClickItemHandler={(label) => {
              // console.log(label);
              setCommentType(label);
            }}
            itemAlign="start"
            align="left"
            size="small"
            backgroundColor={comment.type === "Passage" ? "#ff7878" : "#5561ff"}
            color="#ffffff"
            initText={
              firstLoading && comment.transType
                ? comment.transType
                : l(commentType)
            }
            items={[
              {
                key: "Passage",
                label: firstLoading
                  ? componentsTextData.verseLabel
                  : l("Passage"),
                href: "#",
                backgroundColor: "#ff7878",
                color: "#ffffff",
              },
              {
                key: "Feeling",
                label: firstLoading ? componentsTextData.feelLabel : l("Feeling"),
                href: "#",
                backgroundColor: "#5561ff",
                color: "#ffffff",
              },
            ]}
          />
        </DefaultCol>
        <DefaultCol style={{ paddingLeft: "0", paddingRight: "0.3rem" }}>
          <CustomInput
            {...register("text", {
              required: {
                value: true,
                message: l("Enter a passage or feeling from the book."),
              },
              validate: (value) => {
                if (value !== comment.text || commentType !== comment.type)
                  return true;
                else return l("The content is the same.");
              },
            })}
            placeholder={comment.text}
            onFocus={onFocusHandler}
            onKeyUp={enterKeyUpEventHandler}
            clearButton={setValue}
          />
        </DefaultCol>
        <DefaultCol
          style={{
            maxWidth: "8rem",
            paddingLeft: "0",
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
                    deleteCommentHandler(book.id, comment.id);
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
            {getErrorMsg(formState.errors, "text", "required") ||
              getErrorMsg(formState.errors, "text", "validate")}
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
