"use client";

import { Accordion, Form, Row } from "react-bootstrap";
import { DefaultCol } from "../atoms/DefaultAtoms";
import { CustomButton } from "../atoms/CustomButton";
import { getErrorMsg, l } from "@/services/util/util";
import { accordionCustomStyle } from "../molecules/CustomMolecules";
import { CustomInput, InputWrapper } from "../atoms/CustomInput";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { DivisionLine } from "../molecules/DefaultMolecules";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
  mainListAccordionActiveState,
  showModalState,
  userInfoState,
} from "@/states/states";
import { CustomDropdown } from "../atoms/CustomDropdown";
import { FocusEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { BookType, CommentType, LastVisibleType } from "@/types/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getLastVisible,
  getUserPath,
  insertData,
  queryData,
  updateData,
} from "@/services/firebase/db";
import { checkLogin } from "@/services/firebase/auth";
import { useForm } from "react-hook-form";
import { CenterCol, CustomSpinner } from "../atoms/CustomAtoms";
import { DocumentData } from "firebase/firestore";

interface BookListProps {
  serverBookData: BookType[];
  bookLastVisible: LastVisibleType;
  componentsTextData: Record<string, string>;
}

export default function BookList({
  serverBookData,
  componentsTextData,
  bookLastVisible,
}: BookListProps) {
  const [mainListAccordionActive, setMainListAccordionActive] = useRecoilState(
    mainListAccordionActiveState
  );
  const [fold, setFold] = useState(false);
  const [firstLoading, setFirstLoading] = useState(true);
  const setShowModal = useSetRecoilState(showModalState);
  const userInfo = useRecoilValue(userInfoState);
  const [bookList, setBookList] = useState<BookType[]>([]);
  const bookLoadMoreButtonRef = useRef<HTMLButtonElement>(null);

  const [lastVisible, setLastVisible] = useState<LastVisibleType>(null);
  const [nextLastVisible, setNextLastVisible] = useState<LastVisibleType>(null);
  const [commentLastVisible, setCommentLastVisible] = useState<
    Record<string, LastVisibleType>
  >({});
  const [nextCommentLastVisible, setNextCommentLastVisible] = useState<
    Record<string, LastVisibleType>
  >({});
  const [targetLoadingComment, setTargetLoadingComment] = useState<
    string | null
  >(null);

  const {
    register: addBookRegister,
    handleSubmit: addBookHandleSubmit,
    formState: addBookFormState,
    setValue: addBookSetValue,
  } = useForm();
  const {
    register: editBookRegister,
    handleSubmit: editBookHandleSubmit,
    setValue: editBookSetValue,
  } = useForm();
  const {
    register: addCommentRegister,
    handleSubmit: addCommentHandleSubmit,
    setValue: addCommentSetValue,
  } = useForm();
  const {
    register: editCommentRegister,
    handleSubmit: editCommentHandleSubmit,
    setValue: editCommentSetValue,
  } = useForm();
  const [addCommentTypes, setAddCommentTypes] = useState<
    Record<string, string>
  >({});
  const [editCommentTypes, setEditCommentTypes] = useState<
    Record<string, string>
  >({});

  const [noMoreBookData, setNoMoreBookData] = useState<boolean>(false);
  const [noMoreCommentsData, setNoMoreCommentsData] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    setFirstLoading(false);
    setBookList(serverBookData);
    rerenderEditBookForm(serverBookData);

    // 무한 로딩을 위한 스크롤 이벤트 리스너
    let lastScrollY = 0;
    addEventListener("scroll", (e) => {
      const scrollY = window.scrollY;
      const direction = lastScrollY - scrollY;
      if (direction < 0) {
        if (document.body.scrollHeight < window.innerHeight + scrollY + 5) {
          if (!noMoreBookData) bookLoadMoreButtonRef.current?.click();
        }
      }
      // 현재의 스크롤 값을 저장
      lastScrollY = scrollY;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // 서버로부터 전달 받은 마지막 데이터 키 값을 다음 로드할 데이터 기준점으로 활용
    // 서버와 클라이언트 간 lastVisible 데이터 구조가 일치하지 않아 추가함
    if (userInfo?.uid) {
      if (bookLastVisible?.constructor === String) {
        const path = `${getUserPath()}/${userInfo?.uid}/books`;
        getLastVisible(path, bookLastVisible).then((data) => {
          setNextLastVisible(data);
        });
      }
      bookList.map((book) => {
        if (book.commentLastVisible?.constructor === String) {
          const path = `${getUserPath()}/${userInfo?.uid}/books/${
            book.id
          }/comments`;
          getLastVisible(path, book.commentLastVisible).then((data) => {
            const tempCommentLastVisible = {
              ...nextCommentLastVisible,
            };
            tempCommentLastVisible[book.id] = data;
            setNextCommentLastVisible(tempCommentLastVisible);
          });
        }
      });
    }
  }, [userInfo]);

  const rerenderEditBookForm = (bookList: BookType[]) => {
    const tempAddCommentTypes = { ...addCommentTypes };
    bookList.map((book) => {
      editBookSetValue(`title.${book.id}`, book.title);
      editBookSetValue(`author.${book.id}`, book.author);
      tempAddCommentTypes[`text.${book.id}`] = "Verse";
      if (book.comments && book.comments.length > 0) {
        const tempEditCommentTypes: Record<string, string> = {
          ...editCommentTypes,
        };
        book.comments.map((comment) => {
          editCommentSetValue(`text.${book.id}.${comment.id}`, comment.text);
          tempEditCommentTypes[`text.${book.id}.${comment.id}`] = comment.type;
        });
        setEditCommentTypes(tempEditCommentTypes);
      }
    });
    setAddCommentTypes(tempAddCommentTypes);
  };

  const queryBookData = async () => {
    try {
      if (userInfo?.uid) {
        const bookPath = `${getUserPath()}/${userInfo?.uid}/books`;
        const bookData = await queryData(
          [],
          bookPath,
          lastVisible,
          "timestamp",
          "desc",
          3
        );
        const tempBookList: DocumentData[] = [];
        const tempNextCommentLastVisible = { ...nextCommentLastVisible };
        for (let i = 0; i < bookData.dataList.length; i++) {
          const book = bookData.dataList[i];
          const tempBook = {
            id: book.id,
            title: book.title,
            author: book.author,
            timestamp: book.timestamp,
            comments: [] as CommentType[],
            commentLastVisible: null as LastVisibleType,
          };
          const commentPath = `${getUserPath()}/${userInfo?.uid}/books/${
            book.id
          }/comments`;
          const commentData = await queryData(
            [],
            commentPath,
            commentLastVisible[book.id] || null,
            "timestamp",
            "desc",
            3
          );
          if (commentData) {
            tempBook.comments = commentData.dataList as CommentType[];
            tempBook.commentLastVisible = commentData.lastVisible;
            tempNextCommentLastVisible[book.id] = commentData.lastVisible;
          }
          setNextCommentLastVisible(tempNextCommentLastVisible);
          tempBookList.push(tempBook);
        }
        return {
          dataList: tempBookList,
          lastVisible: bookData.lastVisible,
        };
      } else {
        return false;
      }
    } catch (error: any) {
      console.log(error);
      return false;
    }
  };

  // book 데이터 조회에 react query를 활용
  const { isFetching: bookIsFetching, refetch: bookRefetch } = useQuery(
    ["loadBookData"],
    queryBookData,
    {
      refetchOnWindowFocus: false,
      retry: 0,
      onSuccess: (data) => {
        if (data) {
          // 조회 성공 시 중복 데이터 제거 (추가된 데이터가 있을 경우 db 재조회를 하지 않고 걸러내기 위함)
          const dataBookList: BookType[] = [];
          data.dataList.map((bookData) => {
            const dataCommentList: CommentType[] = [];
            bookData.comments.map((commentData: any) => {
              dataCommentList.push({
                id: commentData.id,
                type: commentData.type,
                text: commentData.text,
                timestamp: commentData.timestamp.toMillis(),
              });
            });
            dataBookList.push({
              id: bookData.id,
              title: bookData.title,
              author: bookData.author,
              timestamp: bookData.timestamp.toMillis(),
              comments: dataCommentList,
            });
          });

          const tempList = [...bookList, ...dataBookList];
          const uniqueList = tempList.filter((value1, index) => {
            return (
              tempList.findIndex((value2) => {
                return value1?.id === value2?.id;
              }) === index
            );
          });

          //lastVisible이 null일 경우 더 이상 조회할 데이터가 없다고 판단함
          lastVisible && !noMoreBookData
            ? setBookList(uniqueList)
            : setBookList(data.dataList as BookType[]);
          data.lastVisible
            ? setNextLastVisible(data.lastVisible)
            : setNoMoreBookData(true);
        }
      },
      onError: (e: any) => {
        console.log(e.message);
      },
    }
  );

  const queryCommentData = async () => {
    try {
      if (userInfo?.uid) {
        const path = `${getUserPath()}/${
          userInfo?.uid
        }/books/${targetLoadingComment}/comments`;
        return queryData(
          [],
          path,
          commentLastVisible[targetLoadingComment || ""],
          "timestamp",
          "desc",
          3
        );
      } else {
        return false;
      }
    } catch (error: any) {
      console.log(error);
      return false;
    }
  };

  // comment 데이터 조회에 react query를 활용
  const { isFetching: commentIsFetching, refetch: commentRefetch } = useQuery(
    ["loadCommentData"],
    queryCommentData,
    {
      refetchOnWindowFocus: false,
      retry: 0,
      onSuccess: (data) => {
        if (data) {
          // 조회 성공 시 중복 데이터 제거 (추가된 데이터가 있을 경우 db 재조회를 하지 않고 걸러내기 위함)
          const dataList: CommentType[] = [];
          data.dataList.map((data) => {
            dataList.push({
              id: data.id,
              type: data.type,
              text: data.text,
              timestamp: data.timestamp.toMillis(),
            });
          });
          const tempBookList = [...bookList];
          for (let i = 0; i < tempBookList.length; i++) {
            if (targetLoadingComment === tempBookList[i].id) {
              const tempCommentList = [
                ...(tempBookList[i].comments || []),
                ...dataList,
              ];
              const uniqueCommentList = tempCommentList.filter(
                (value1, index) => {
                  return (
                    tempCommentList.findIndex((value2) => {
                      return value1?.id === value2?.id;
                    }) === index
                  );
                }
              );
              tempBookList[i].comments = uniqueCommentList;
              break;
            }
          }

          //lastVisible이 null일 경우 더 이상 조회할 데이터가 없다고 판단함
          if (
            commentLastVisible[targetLoadingComment || ""] &&
            !noMoreCommentsData[targetLoadingComment || ""]
          ) {
            setBookList(tempBookList);
          }
          if (data.lastVisible) {
            const tempNextCommentLastvisible = { ...nextCommentLastVisible };
            tempNextCommentLastvisible[targetLoadingComment || ""] =
              data.lastVisible;
            setNextCommentLastVisible(tempNextCommentLastvisible);
          } else {
            const tempNoMoreCommentsData = { ...noMoreCommentsData };
            tempNoMoreCommentsData[targetLoadingComment || ""] = true;
            setNoMoreCommentsData(tempNoMoreCommentsData);
          }

          // target 초기화
          setTargetLoadingComment(null);
        }
      },
      onError: (e: any) => {
        console.log(e.message);
      },
    }
  );

  useEffect(() => {
    if (lastVisible) {
      bookRefetch();
    }
  }, [lastVisible]);

  useEffect(() => {
    rerenderEditBookForm(bookList);
  }, [bookList]);

  useEffect(() => {
    if (targetLoadingComment) {
      setCommentLastVisible({...nextCommentLastVisible});
    }
  }, [targetLoadingComment]);

  useEffect(() => {
    if (commentLastVisible[targetLoadingComment || ""]) {
      commentRefetch();
    }
  }, [commentLastVisible]);

  // Book 데이터 추가 시 react query 활용
  const insertBookMutation = useMutation(insertData, {
    onSuccess(data) {
      if (data) {
        addBookSetValue("title", "");
        addBookSetValue("author", "");
        setShowModal({
          show: true,
          title: l("Check"),
          content: l("A book has been added."),
        });
        // 성공 시 참조 오브젝트에 데이터 추가 (db에서 데이터를 새로 조회하지 않음)
        const tempList = [
          {
            id: data.docId,
            ...data.data,
          } as BookType,
          ...bookList,
        ];
        setBookList(tempList);
      }
    },
  });

  const insertBookHandler = (title: string, author: string) => {
    checkLogin().then((user) => {
      if (user) {
        const path = `${getUserPath()}/${user?.uid}/books`;
        insertBookMutation.mutate({
          path: path,
          data: {
            title: title,
            author: author,
          },
        });
      }
    });
  };

  // Comment 데이터 추가 시 react query 활용
  const insertCommentMutation = useMutation(insertData, {
    onSuccess(data) {
      if (data) {
        const bookId = data.path.split("/")[5];
        addCommentSetValue(`text.${bookId}`, "");
        setShowModal({
          show: true,
          title: l("Check"),
          content: l("A comment has been added."),
        });
        // 성공 시 참조 오브젝트에 데이터 추가 (db에서 데이터를 새로 조회하지 않음)
        const tempBookList = [...bookList];
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
      }
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
        const tempList = [...bookList];
        for (let i = 0; i < tempList.length; i++) {
          if (tempList[i].id === data?.docId) {
            tempList[i].title = data.data.title;
            tempList[i].author = data.data.author;
            break;
          }
        }
        setBookList(tempList);
      }
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
        console.log(data);
        const bookId = data.path.split("/")[5];
        const tempBookList = [...bookList];
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
      }
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

  // 엔터 입력 시 submit 버튼 클릭 효과
  const enterKeyUpEventHandler = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.form?.requestSubmit();
    }
  };

  const onFocusHandler = (e: FocusEvent<HTMLInputElement>) => {
    const value = e.currentTarget?.value;
    const target = e.currentTarget;
    e.currentTarget.value = "";
    setTimeout(() => {
      target.value = value;
    }, 100);
  };

  const editCommentForm = (book: BookType, comment: CommentType) => {
    return (
      <Form
        onSubmit={editCommentHandleSubmit((data) => {
          updateCommentHandler(
            book.id,
            comment.id,
            editCommentTypes[`text.${book.id}.${comment.id}`] || "Verse",
            data.text[book.id][comment.id]
          );
        })}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
        }}
      >
        <Row
          style={{
            paddingBottom: "10px",
            paddingLeft: "15px",
          }}
        >
          <DefaultCol style={{ maxWidth: "20%" }}>
            <CustomDropdown
              onClickItemHandler={(label) => {
                // console.log(label);
                const tempEditCommentTypes = { ...editCommentTypes };
                tempEditCommentTypes[`text.${book.id}.${comment.id}`] = label;
                setEditCommentTypes(tempEditCommentTypes);
              }}
              itemAlign="start"
              align="left"
              size="small"
              backgroundColor={comment.type === "Verse" ? "#ff7878" : "#5561ff"}
              color="#ffffff"
              initText={
                firstLoading ? comment.transType || "" : l(comment.type)
              }
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
                  label: firstLoading
                    ? componentsTextData.feelLabel
                    : l("Feel"),
                  href: "#",
                  backgroundColor: "#5561ff",
                  color: "#ffffff",
                },
              ]}
            />
          </DefaultCol>
          <DefaultCol style={{ minWidth: "60%" }}>
            <InputWrapper>
              <CustomInput
                {...editCommentRegister(`text.${book.id}.${comment.id}`)}
                style={{ fontSize: "14px" }}
                placeholder={comment.text}
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
  };

  const addCommentForm = (book: BookType) => {
    return (
      <Form
        onSubmit={addCommentHandleSubmit((data) => {
          insertCommentHandler(
            book.id,
            addCommentTypes[`text.${book.id}`] || "Verse",
            data.text[book.id]
          );
        })}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
        }}
      >
        <Row style={{ paddingBottom: "10px", paddingLeft: "10px" }}>
          <DefaultCol style={{ maxWidth: "22%" }}>
            <CustomDropdown
              onClickItemHandler={(label) => {
                // console.log(label);
                const tempAddCommentTypes = { ...addCommentTypes };
                tempAddCommentTypes[`text.${book.id}`] = label;
                setAddCommentTypes(tempAddCommentTypes);
              }}
              itemAlign="start"
              align="left"
              backgroundColor={"#ff7878"}
              color="#ffffff"
              initText={
                firstLoading ? componentsTextData.verseLabel : l("Verse")
              }
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
                  label: firstLoading
                    ? componentsTextData.feelLabel
                    : l("Feel"),
                  href: "#",
                  backgroundColor: "#5561ff",
                  color: "#ffffff",
                },
              ]}
            />
          </DefaultCol>
          <DefaultCol style={{ minWidth: "58%" }}>
            <InputWrapper>
              <CustomInput
                {...addCommentRegister(`text.${book.id}`)}
                placeholder={
                  firstLoading
                    ? componentsTextData.enterContentPlaceholder
                    : l("Enter your content.")
                }
                onKeyUp={enterKeyUpEventHandler}
              />
            </InputWrapper>
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
      </Form>
    );
  };

  const editBookForm = (book: BookType) => {
    return (
      <Form
        onSubmit={editBookHandleSubmit((data) => {
          updateBookHandler(book.id, data.title[book.id], data.author[book.id]);
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
  };

  const addBookForm = () => {
    return (
      <Form
        onSubmit={addBookHandleSubmit((data) => {
          insertBookHandler(data.title, data.author);
        })}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
        }}
      >
        <Row>
          <DefaultCol style={{ minWidth: "45%" }}>
            <InputWrapper>
              <CustomInput
                {...addBookRegister("title", {
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
                {...addBookRegister("author")}
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
            <div style={{ color: "hotpink", paddingTop: "10px" }}>
              {getErrorMsg(addBookFormState.errors, "title", "required")}
            </div>
          </DefaultCol>
        </Row>
      </Form>
    );
  };

  return (
    <>
      <style>{accordionCustomStyle}</style>
      <Row>
        <DefaultCol>
          <Accordion
            defaultActiveKey="WriteInputForm"
            onSelect={() => {
              setFold(!fold);
            }}
          >
            <Accordion.Item eventKey="WriteInputForm">
              <Accordion.Header>
                <div
                  style={{
                    textAlign: "start",
                    width: "100%",
                    color: "#5a5a5a",
                  }}
                >
                  {firstLoading
                    ? componentsTextData.addBookFormTitle
                    : l("Add a book")}{" "}
                  <span style={{ fontSize: "14px" }}>{fold ? "▲" : "▼"}</span>
                </div>
              </Accordion.Header>
              <Accordion.Body>{addBookForm()}</Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </DefaultCol>
      </Row>
      <DivisionLine color="transparent" />
      <Row>
        <DefaultCol>
          <Accordion
            onSelect={(e) => {
              setMainListAccordionActive(e);
            }}
            defaultActiveKey={mainListAccordionActive}
          >
            {(firstLoading || bookList.length === 0
              ? serverBookData
              : bookList
            ).map((book) => {
              return (
                <>
                  <Accordion.Item
                    key={book.id}
                    eventKey={book.id}
                    style={{ paddingBottom: "10px" }}
                  >
                    <Accordion.Header>
                      <span style={{ width: "16px", height: "16px" }}>
                        <FontAwesomeIcon
                          icon={faBook}
                          color="#d1d1d1"
                          size="1x"
                        />
                      </span>
                      <div style={{ paddingLeft: "5px", paddingRight: "5px" }}>
                        {book.title}
                        {book.author && (
                          <>
                            {" - "}
                            <span style={{ color: "#6f6f6f" }}>
                              {book.author}
                            </span>
                          </>
                        )}
                      </div>
                      <span style={{ width: "16px", height: "16px" }}>
                        <FontAwesomeIcon
                          icon={faPenToSquare}
                          color={
                            book.id === mainListAccordionActive
                              ? "#ff8a8a"
                              : "#b6b6b6"
                          }
                          size="xs"
                        />
                      </span>
                    </Accordion.Header>
                    <Accordion.Body>
                      {editBookForm(book)}
                      {addCommentForm(book)}
                    </Accordion.Body>
                    <Accordion defaultActiveKey="">
                      {book.comments?.map((comment) => {
                        return (
                          <Accordion.Item
                            key={`${book.id}.${comment.id}`}
                            eventKey={`${book.id}.${comment.id}`}
                          >
                            <Accordion.Header>
                              <div
                                style={{
                                  paddingLeft: "10px",
                                  fontSize: "14px",
                                }}
                              >
                                <span
                                  style={{
                                    color:
                                      comment.type === "Verse"
                                        ? "#ff7768"
                                        : "#5561ff",
                                    minWidth: "40px",
                                    display: "inline-flex",
                                  }}
                                >
                                  {firstLoading
                                    ? comment.transType
                                    : l(comment.type)}
                                </span>{" "}
                                <span style={{ color: "#6b6b6b" }}>
                                  {comment.text}
                                </span>
                              </div>
                            </Accordion.Header>
                            <Accordion.Body>
                              {editCommentForm(book, comment)}
                            </Accordion.Body>
                          </Accordion.Item>
                        );
                      })}
                    </Accordion>
                    {nextCommentLastVisible[book.id] &&
                      !noMoreCommentsData[book.id] && (
                        <Row style={{ paddingLeft: "30px" }}>
                          <CenterCol>
                            {(book.comments || []).length > 0 &&
                            commentIsFetching &&
                            targetLoadingComment === book.id ? (
                              <CustomButton align="left" color="#b5b5b5">
                                <CustomSpinner animation="border" size="sm" />
                              </CustomButton>
                            ) : (
                              <CustomButton
                                align="left"
                                type="button"
                                size="sm"
                                color="#b5b5b5"
                                onClick={() => {
                                  setTargetLoadingComment(book.id);
                                }}
                              >
                                {l("Load More")}
                              </CustomButton>
                            )}
                          </CenterCol>
                        </Row>
                      )}
                  </Accordion.Item>
                </>
              );
            })}
          </Accordion>
        </DefaultCol>
      </Row>
      {nextLastVisible && !noMoreBookData && (
        <Row>
          <CenterCol>
            {bookList.length > 0 && bookIsFetching ? (
              <CustomButton align="center" color="#999999">
                <CustomSpinner animation="border" />
              </CustomButton>
            ) : (
              <CustomButton
                align="center"
                type="button"
                color="#999999"
                onClick={() => {
                  setLastVisible(nextLastVisible);
                }}
              >
                {l("Load More")}
              </CustomButton>
            )}
          </CenterCol>
        </Row>
      )}
    </>
  );
}
