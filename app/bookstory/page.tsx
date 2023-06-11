import { admin } from "@/services/firebase/firebase.admin";
import { cookies } from "next/dist/client/components/headers";
import Home from "../page";
import BookStory from "@/components/templates/BookStory";
import { BookType, CommentType } from "@/types/types";
import { l } from "@/services/util/util";
import { getUserPath } from "@/services/firebase/db";
import { queryDataFromServer } from "@/services/firebase/db.admin";

const BookStoryPage = async () => {
  try {
    // firebase 서버 토큰 검증
    const token = await admin
      .auth()
      .verifyIdToken(cookies().get("token")?.value || "");
    if (token.uid !== "") {
      const componentsTextData: Record<string, string> = {
        title: l("My bookshelf"),
        addBookFormTitle: l("Add a book"),
        bookTitlePlaceholder: l("Book Title"),
        bookAuthorPlaceholder: l("Book author"),
        addButton: l("Add"),
        editButton: l("Edit"),
        verseLabel: l("Verse"),
        feelLabel: l("Feel"),
        enterContentPlaceholder: l("Enter your content."),
      };

      // 서버로부터 데이터 가져오기
      const fullPath = `${getUserPath()}/${token.uid}/books`;
      const books = await queryDataFromServer(
        [],
        fullPath,
        "timestamp",
        "desc",
        3
      );
      const serverBookData: BookType[] = [];

      await (() => {
        return new Promise((resolve) => {
          books.dataList.map(async (book) => {
            const fullPath = `${getUserPath()}/${token.uid}/books/${
              book.id
            }/comments`;
            const comments = await queryDataFromServer(
              [],
              fullPath,
              "timestamp",
              "desc",
              3
            );
            const commentList: CommentType[] = [];
            comments.dataList.map((comment) => {
              commentList.push({
                id: comment.id,
                text: comment.text,
                type: comment.type,
                transType: l(comment.type),
                timestamp: comment.timestamp.toMillis(),
              });
            });
            commentList.sort((a, b) => {
              return (b.timestamp || 0) - (a.timestamp || 0);
            });
            serverBookData.push({
              id: book.id,
              title: book.title,
              author: book.author,
              timestamp: book.timestamp.toMillis(),
              comments: commentList,
              commentLastVisible: comments.lastVisible,
            });
            if (books.dataList.length === serverBookData.length) {
              serverBookData.sort((a, b) => {
                return (b.timestamp || 0) - (a.timestamp || 0);
              });
              resolve(true);
            }
          });
        });
      })();

      return (
        <BookStory
          serverBookData={serverBookData}
          bookLastVisible={books.lastVisible}
          componentsTextData={componentsTextData}
        />
      );
    } else {
      return (
        // 인증 정보 없을 경우 기본 값
        <></>
      );
    }
  } catch (error: any) {
    if (error.code === "auth/id-token-expired") {
      // 토큰 만료 시 루트 페이지로 이동
      return <Home />;
    } else {
      console.log(error.message);
      // 다른 에러도 루트 페이지로 이동 (딱히 다른 대안이 없음)
      return <Home />;
    }
  }
};

export default BookStoryPage;
