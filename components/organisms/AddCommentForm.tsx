import { getUserPath, insertData } from "@/services/firebase/db";
import {
  bookListState,
  showModalState,
  userInfoState,
} from "@/states/states";
import { BookType } from "@/types/types";
import { useMutation } from "@tanstack/react-query";
import { Form, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { DefaultCol } from "../atoms/DefaultAtoms";
import { CustomDropdown } from "../atoms/CustomDropdown";
import { enterKeyUpEventHandler, getErrorMsg, l } from "@/services/util/util";
import { CustomButton } from "../atoms/CustomButton";
import { useEffect, useState } from "react";
import { ClearInput } from "../atoms/CustomInput";

interface AddCommentFormProps {
  book: BookType;
  componentsTextData: Record<string, string>;
}

export default function AddCommentForm({
  book,
  componentsTextData,
}: AddCommentFormProps) {
  const { register, handleSubmit, setValue, formState } = useForm();
  const [bookList, setBookList] = useRecoilState(bookListState);
  const setShowModal = useSetRecoilState(showModalState);
  const userInfo = useRecoilValue(userInfoState);
  const [commentType, setCommentType] = useState("Verse");
  const [firstLoading, setFirstLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFirstLoading(false);
  }, []);

  // Comment 데이터 추가 시 react query 활용
  const insertCommentMutation = useMutation(insertData, {
    onSuccess(data) {
      if (data) {
        const bookId = data.path.split("/")[5];
        setValue("text", "");
        setShowModal({
          show: true,
          title: l("Check"),
          content: l("A comment has been added."),
        });
        // 성공 시 참조 오브젝트에 데이터 추가 (db에서 데이터를 새로 조회하지 않음)
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
              tempBookList[i].comments = [
                comment,
                ...(tempBookList[i].comments || []),
              ];
            } else {
              tempBookList[i].comments = [comment];
            }
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

  const insertCommentHandler = (bookId: string, type: string, text: string) => {
    const path = `${getUserPath()}/${userInfo?.uid}/books/${bookId}/comments`;
    insertCommentMutation.mutate({
      path: path,
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
          insertCommentHandler(book.id, commentType, data.text);
        }
      })}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.preventDefault();
      }}
    >
      <Row style={{ paddingLeft: "10px" }}>
        <DefaultCol style={{ maxWidth: "22%" }}>
          <CustomDropdown
            onClickItemHandler={(label) => {
              // console.log(label);
              setCommentType(label);
            }}
            itemAlign="start"
            align="left"
            backgroundColor={"#ff7878"}
            color="#ffffff"
            initText={firstLoading ? componentsTextData.verseLabel : l("Verse")}
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
        <DefaultCol style={{ minWidth: "58%" }}>
          <ClearInput
            {...register("text", {
              required: {
                value: true,
                message: l("Enter your content."),
              },
            })}
            placeholder={
              firstLoading
                ? componentsTextData.enterContentPlaceholder
                : l("Enter your content.")
            }
            onKeyUp={enterKeyUpEventHandler}
            clearValue={setValue}
          />
        </DefaultCol>
        <DefaultCol style={{ maxWidth: "20%" }}>
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
            {getErrorMsg(formState.errors, "text", "required")}
          </div>
        </DefaultCol>
      </Row>
    </Form>
  );
}
