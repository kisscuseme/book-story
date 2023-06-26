"use client";

import { l } from "@/services/util/util";
import {
  DefaultCol,
  DefaultContainer,
  DefaultTitle,
} from "../atoms/DefaultAtoms";
import { TopBar } from "../molecules/TopBar";
import TranslationFromClient from "../organisms/TranslationFromClient";
import { useRecoilState, useRecoilValue } from "recoil";
import { rerenderDataState, userInfoState } from "@/states/states";
import { useEffect, useState } from "react";
import BookList from "../organisms/BookList";
import Menu from "../organisms/Menu";
import { checkLogin } from "@/services/firebase/auth";
import { BookType, LastVisibleType } from "@/types/types";
import { Image } from "react-bootstrap";
import Link from "next/link";

export default function BookStory({
  serverBookData,
  componentsTextData,
  bookLastVisible,
}: {
  serverBookData: BookType[];
  componentsTextData: Record<string, string>;
  bookLastVisible: LastVisibleType;
}) {
  const rerenderData = useRecoilValue(rerenderDataState);
  const [userInfo, setUserInfo] = useRecoilState(userInfoState);
  const [firstLoading, setFirstLoading] = useState(true);

  useEffect(() => {
    setFirstLoading(false);
  }, []);

  useEffect(() => {}, [rerenderData]);

  checkLogin().then((data) => {
    if (!userInfo) {
      setUserInfo({
        uid: data?.uid || "",
        name: data?.displayName || "",
        email: data?.email || "",
      });
    }
  });

  return (
    <DefaultContainer style={{paddingTop: "50px"}}>
      <TranslationFromClient />
      <TopBar>
        <DefaultCol style={{paddingLeft: "0.5rem"}}>
          <Link href="/">
            <Image src="/images/logo.png" width={"36px"} style={{rotate: "-5deg"}} />
          </Link>
        </DefaultCol>
        <DefaultCol>
          <Menu />
        </DefaultCol>
      </TopBar>
      <DefaultTitle>
        {firstLoading ? componentsTextData.title : l("My bookshelf")}
      </DefaultTitle>
      <BookList
        serverBookData={serverBookData}
        bookLastVisible={bookLastVisible}
        componentsTextData={componentsTextData}
      />
    </DefaultContainer>
  );
}
