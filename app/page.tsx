"use client";

import { checkLogin } from "@/services/firebase/auth";
import { setCookie } from "@/services/util/util";
import { useEffect } from "react";
import LoadingPage from "./loading";

const Home = () => {
  useEffect(() => {
    // 로그인 여부 체크
    checkLogin()
      .then(async (data) => {
        if (data) {
          // 서버 인증에 필요한 토큰 값 저장
          setCookie("token", await data.getIdToken(true));
          // Diary 페이지 이동
          window.location.replace("/bookstory");
        } else {
          // 로그인이 안 되어 있는 경우 토큰 값 초기화
          setCookie("token", "", -1);
          // 로그인 페이지 이동
          window.location.replace("/signin");
        }
      })
      .catch((error) => {
        console.log(error);
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <LoadingPage></LoadingPage>;
};

export default Home;
