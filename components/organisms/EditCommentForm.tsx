import { getUserPath, updateData } from "@/services/firebase/db";
import {
  bookListState,
  firstLoadingState,
  showModalState,
  userInfoState,
} from "@/states/states";
import { BookType, CommentType } from "@/types/types";
import { useMutation } from "@tanstack/react-query";
import { Form, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { DefaultCol } from "../atoms/DefaultAtoms";
import { CustomDropdown } from "../atoms/CustomDropdown";
import {
  enterKeyUpEventHandler,
  getErrorMsg,
  l,
  onFocusHandler,
} from "@/services/util/util";
import { CustomButton } from "../atoms/CustomButton";
import { useEffect, useState } from "react";
import { ClearInput } from "../atoms/CustomInput";

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
  const userInfo = useRecoilValue(userInfoState);
  const [commentType, setCommentType] = useState(comment.type);
  const firstLoading = useRecoilValue(firstLoadingState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setValue("text", comment.text);
  }, []);

  // Comment 데이터 수정 시 react query 활용
  const updateCommentMutation = useMutation(updateData, {
    onSuccess(data) {
      if (data) {
        setShowModal({
          show: true,
          title: l("Check"),
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
          text: data.data.text,
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
        text: text,
      },
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
    >
      <Row
        style={{
          paddingLeft: "15px",
        }}
      >
        <DefaultCol style={{ maxWidth: "20%" }}>
          <CustomDropdown
            onClickItemHandler={(label) => {
              // console.log(label);
              setCommentType(label);
            }}
            itemAlign="start"
            align="left"
            size="small"
            backgroundColor={comment.type === "Verse" ? "#ff7878" : "#5561ff"}
            color="#ffffff"
            initText={firstLoading ? comment.transType || "" : l(comment.type)}
            items={[
              {
                key: "Verse",
                label: firstLoading
                  ? componentsTextData.verseLabel
                  : l("Verse"),
                href: "#",
                backgroundColor: "#ff7878",
                color: "#ffffff",
              },
              {
                key: "Feel",
                label: firstLoading ? componentsTextData.feelLabel : l("Feel"),
                href: "#",
                backgroundColor: "#5561ff",
                color: "#ffffff",
              },
            ]}
          />
        </DefaultCol>
        <DefaultCol style={{ minWidth: "60%" }}>
          <ClearInput
            {...register("text", {
              required: {
                value: true,
                message: l("Enter your content."),
              },
            })}
            style={{ fontSize: "14px" }}
            placeholder={comment.text}
            onFocus={onFocusHandler}
            onKeyUp={enterKeyUpEventHandler}
            clearValue={setValue}
          />
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
      <Row>
        <DefaultCol>
          <div
            style={{ color: "hotpink", paddingTop: "5px", fontSize: "14px" }}
          >
            {getErrorMsg(formState.errors, "text", "required")}
          </div>
        </DefaultCol>
      </Row>
    </Form>
  );
}
