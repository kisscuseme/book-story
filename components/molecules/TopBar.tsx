"use client";

import { ReactNode } from "react";
import { styled } from "styled-components";
import { Row } from "react-bootstrap";

const TopBarRow = styled(Row)`
  height: 50px;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: #fbf6ff;
  z-index: 100;
`;

// 상단 바 구성에 사용
export const TopBar = ({ children }: { children: ReactNode }) => {
  return (
    <TopBarRow>
      {children}
    </TopBarRow>
  );
};
