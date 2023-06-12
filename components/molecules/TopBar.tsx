"use client";

import { ReactNode } from "react";
import { styled } from "styled-components";
import { DefaultCol, DefaultRow } from "../atoms/DefaultAtoms";

const TopBarRow = styled(DefaultRow)`
  height: 70px;
`;

// 상단 바 구성에 사용
export const TopBar = ({ children }: { children: ReactNode }) => {
  return (
    <TopBarRow>
      <DefaultCol>{children}</DefaultCol>
    </TopBarRow>
  );
};
