"use client";

import { forwardRef } from "react";
import {
  Button,
  ButtonProps,
  Col,
  Container,
  Row,
} from "react-bootstrap";
import { styled } from "styled-components";
import { CustomButton } from "./CustomButton";

// 기본 버튼 스타일 정의
const StyledButton = styled(Button)`
  float: right;
`;
export const DefaultButton = forwardRef((props: ButtonProps, ref) => {
  const { children, ...otherProps } = props;
  return (
    <StyledButton {...otherProps} ref={ref}>
      {children}
    </StyledButton>
  );
});
DefaultButton.displayName = "DefaultButton";

// 기본 컨테이너 스타일 정의
export const DefaultContainer = styled(Container)`
  background-color: transparent;
  max-width: 550px;
  min-width: 375px;
  min-height: 100vh;
  height: 100%;
  padding-left: 20px;
  padding-right: 20px;
`;

// 기본 Row 스타일 정의
export const DefaultRow = styled(Row)`
  min-height: 70px;
`;

// 기본 Col 스타일 정의
export const DefaultCol = styled(Col)`
  margin: auto;
`;

// 그룹 버튼 스타일 정의
export const GroupButton = styled(CustomButton)`
  margin: 10px;
`;

// 기본 타이틀 스타일 정의
export const DefaultTitle = styled.h3`
  text-align: center;
  padding: 30px 0;
`;
