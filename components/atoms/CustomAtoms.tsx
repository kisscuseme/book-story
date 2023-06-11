import { Col, Spinner } from "react-bootstrap";
import { styled } from "styled-components";

// 중앙 정렬이 필요할 경우 사용
export const CenterCol = styled(Col)`
  text-align: center;
  margin: auto;
`;

export const CustomSpinner = styled(Spinner)`
  margin: auto;
  display: flex;
  color: #9c6aff;
`;