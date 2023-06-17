import { ThemeProvider, styled } from "styled-components";

// 컨텐츠를 라인으로 구분하기 위함
const StyledDivisionLine = styled.div`
  border-width: 1px;
  border-style: solid;
  border-color: ${(props) => props.theme.borderColor};
  margin: 0.7rem;
`;

const DivisionLine = ({ color = "#ffffff" }: { color?: string }) => {
  const theme = {
    borderColor: color,
  };
  return (
    <ThemeProvider theme={theme}>
      <StyledDivisionLine />
    </ThemeProvider>
  );
};

export { DivisionLine };
