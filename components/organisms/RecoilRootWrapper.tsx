"use client";

import React from "react";
import { RecoilRoot } from "recoil";

// recoil을 사용하기 위한 래퍼 컴포넌트
export default function RecoilRootWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RecoilRoot>{children}</RecoilRoot>;
}
