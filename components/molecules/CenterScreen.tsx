"use client";

import { Col, Row } from "react-bootstrap";
import { styled } from "styled-components";
import { DefaultContainer } from "../atoms/DefaultAtoms";
import { ReactNode } from "react";

const FullCenterRow = styled(Row)`
  height: 100vh;
`;

const FullCenterCol = styled(Col)`
  width: 100vw;
  margin: auto;
  text-align: center;
`;

// 화면 중앙에 컨텐츠 표시가 필요한 경우 사용
export const CenterScreen = ({ children }: { children: ReactNode }) => {
  return (
    <DefaultContainer>
      <FullCenterRow>
        <FullCenterCol>{children}</FullCenterCol>
      </FullCenterRow>
    </DefaultContainer>
  );
};
