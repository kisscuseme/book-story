"use client";

import { showModalState } from "@/states/states";
import React from "react";
import { useRecoilValue } from "recoil";
import { Alert } from "../molecules/Alert";

// Alert 기능을 전역적으로 사용하기 위한 컴포넌트
export default function ShowAlert() {
  const showModal = useRecoilValue(showModalState);

  return (
    <Alert
      title={showModal.title}
      content={showModal.content}
      show={showModal.show}
      callback={showModal.callback}
      confirm={showModal.confirm}
    />
  );
}
