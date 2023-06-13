"use client";

import { Accordion, Row } from "react-bootstrap";
import { DefaultCol } from "../atoms/DefaultAtoms";
import { CustomButton } from "../atoms/CustomButton";
import { l } from "@/services/util/util";
import { accordionCustomStyle } from "../molecules/CustomMolecules";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { DivisionLine } from "../molecules/DefaultMolecules";
import { useRecoilState, useRecoilValue } from "recoil";
import {
  bookListState,
  mainListAccordionActiveState,
  userInfoState,
} from "@/states/states";
import { useEffect, useRef, useState } from "react";
import { BookType, CommentType, LastVisibleType } from "@/types/types";
import { useQuery } from "@tanstack/react-query";
import { getLastVisible, getUserPath, queryData } from "@/services/firebase/db";
import { CenterCol, CustomSpinner } from "../atoms/CustomAtoms";
import { DocumentData } from "firebase/firestore";
import EditCommentForm from "./EditCommentForm";
import AddBookForm from "./AddBookForm";
import AddCommentForm from "./AddCommentForm";
import EditBookForm from "./EditBookForm";

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
  const userInfo = useRecoilValue(userInfoState);
  const [bookList, setBookList] = useRecoilState(bookListState);
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

  const [noMoreBookData, setNoMoreBookData] = useState<boolean>(false);
  const [noMoreCommentsData, setNoMoreCommentsData] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    setFirstLoading(false);
    setBookList(serverBookData);

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
  const {
    isFetching: bookIsFetching,
    isLoading: bookIsLoading,
    refetch: bookRefetch,
  } = useQuery(["loadBookData"], queryBookData, {
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

        const tempBookList = [...bookList, ...dataBookList];
        const uniqueList = tempBookList.filter((value1, index) => {
          return (
            tempBookList.findIndex((value2) => {
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
  });

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
  const {
    isFetching: commentIsFetching,
    isLoading: commentIsLoading,
    refetch: commentRefetch,
  } = useQuery(["loadCommentData"], queryCommentData, {
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
  });

  useEffect(() => {
    if (lastVisible) {
      bookRefetch();
    }
  }, [lastVisible]);

  useEffect(() => {
    if (targetLoadingComment) {
      setCommentLastVisible({ ...nextCommentLastVisible });
    }
  }, [targetLoadingComment]);

  useEffect(() => {
    if (commentLastVisible[targetLoadingComment || ""]) {
      commentRefetch();
    }
  }, [commentLastVisible]);

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
              <Accordion.Body>
                <AddBookForm componentsTextData={componentsTextData} />
              </Accordion.Body>
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
                    <EditBookForm
                      book={book}
                      componentsTextData={componentsTextData}
                    />
                    <AddCommentForm
                      book={book}
                      componentsTextData={componentsTextData}
                    />
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
                            <EditCommentForm
                              book={book}
                              comment={comment}
                              componentsTextData={componentsTextData}
                            />
                          </Accordion.Body>
                        </Accordion.Item>
                      );
                    })}
                  </Accordion>
                  {nextCommentLastVisible[book.id] &&
                    !noMoreCommentsData[book.id] ? (
                      <Row style={{ paddingLeft: "30px" }}>
                        <CenterCol>
                          {(book.comments || []).length > 0 &&
                          (commentIsLoading || commentIsFetching) &&
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
                    ) : (
                      (book.commentLastVisible && !commentLastVisible[book.id]) && (
                        <Row style={{ paddingLeft: "30px" }}>
                          <CenterCol>
                            <CustomButton align="left" color="#b5b5b5">
                              <CustomSpinner animation="border" size="sm" />
                            </CustomButton>
                          </CenterCol>
                        </Row>
                      )
                    )}
                </Accordion.Item>
              );
            })}
          </Accordion>
        </DefaultCol>
      </Row>
      {serverBookData.length > 0 ? (nextLastVisible && !noMoreBookData ? (
        <Row>
          <CenterCol>
            {bookList.length > 0 && (bookIsLoading || bookIsFetching) ? (
              <CustomButton align="center" color="#999999">
                <CustomSpinner animation="border" />
              </CustomButton>
            ) : (
              <CustomButton
                align="center"
                type="button"
                color="#999999"
                ref={bookLoadMoreButtonRef}
                onClick={() => {
                  setLastVisible(nextLastVisible);
                }}
              >
                {l("Load More")}
              </CustomButton>
            )}
          </CenterCol>
        </Row>
      ) : (
        !lastVisible && (
          <Row>
            <CenterCol>
              <CustomButton align="center" color="#999999">
                <CustomSpinner animation="border" />
              </CustomButton>
            </CenterCol>
          </Row>
        )
      )) :           <Row>
      <CenterCol>
        <CustomButton align="center" color="#999999">
          <div>{l("No content viewed")}</div>
        </CustomButton>
      </CenterCol>
    </Row>}
    </>
  );
}
