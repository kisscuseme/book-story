"use client";

import { ReactNode } from "react";
import { styled } from "styled-components";
import { Row } from "react-bootstrap";

const TopBarRow = styled(Row)`
  height: 50px;
  position: fixed;
  top: 0;
  left: 0;
  margin: 0%;
  width: 100%;
  background-color: #dddddd;
  z-index: 100;
  box-shadow: 0.05rem 0.05rem 0.2rem #c6c6c6;
`;

// 상단 바 구성에 사용
export const TopBar = ({ children }: { children: ReactNode }) => {
  return (
    <TopBarRow>
      {children}
    </TopBarRow>
  );
};
