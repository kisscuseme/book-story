"use client";

import { Dropdown, SSRProvider } from "react-bootstrap";
import { ReactNode, useEffect, useState } from "react";
import { DropdownProps } from "react-bootstrap";
import { AlignType } from "react-bootstrap/esm/types";
import { ThemeProvider, styled } from "styled-components";
import { useRecoilValue } from "recoil";
import { rerenderDataState } from "@/states/states";

interface DropdownOwnProps {
  /**
   * 배경 색상
   */
  backgroundColor?: string;
  /**
   * 글자 색상
   */
  color?: string;
  /**
   * 크기
   */
  size?: "small" | "medium" | "large";
  /**
   * 초기 텍스트
   */
  initText: string;
  /**
   * ID
   */
  id?: string;
  /**
   * 데이터
   */
  items: DropdownDataProps[] | null;
  /**
   * Dropdown Item 위치
   */
  itemAlign?: AlignType;
  /**
   * 정렬
   */
  align?: "center" | "left" | "right";
  /**
   * Dropdown Click Item Handler
   */
  onClickItemHandler: (label: string | any) => void;
  /**
   * Title
   */
  title?: string;
  /**
   * customToggle
   */
  customToggle?: ReactNode;
}

export type CustomDropdownProps = DropdownOwnProps &
  Omit<DropdownProps, "align" | "children">;

export type DropdownDataProps = {
  key: string;
  label: string;
  href?: string;
  backgroundColor?: string;
  color?: string;
  refData?: any;
};

// Dropdown 컴포넌트 위치 설정
const StyledDropdown = styled(Dropdown)`
  float: right;
`;

// Dropdown 기본 스타일 오버라이딩
const StyledDropdownToggle = styled(Dropdown.Toggle)`
  display: inline-block;
  margin: auto;
  --bs-btn-color: ${(props) => props.theme.color};
  --bs-btn-bg: ${(props) => props.theme.backgroundColor};
  --bs-btn-border-color: ${(props) => props.theme.backgroundColor};
  --bs-btn-hover-color: ${(props) => props.theme.color};
  --bs-btn-hover-bg: ${(props) => props.theme.backgroundColor};
  --bs-btn-hover-border-color: ${(props) => props.theme.backgroundColor};
  --bs-btn-focus-shadow-rgb: 49, 132, 253;
  --bs-btn-active-color: ${(props) => props.theme.color};
  --bs-btn-active-bg: ${(props) => props.theme.backgroundColor};
  --bs-btn-active-border-color: ${(props) => props.theme.backgroundColor};
  --bs-btn-active-shadow: inset 0 0.25rem 0.3rem rgba(0, 0, 0, 0.125);
  --bs-btn-disabled-color: ${(props) => props.theme.color};
  --bs-btn-disabled-bg: ${(props) => props.theme.backgroundColor};
  --bs-btn-disabled-border-color: ${(props) => props.theme.backgroundColor};
  font-size: ${(props) => props.theme.fontSize};
  padding: ${(props) => props.theme.padding};
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      color: ${(props) =>
        props.theme.backgroundColor === "transparent"
          ? "#ffffff"
          : props.theme.backgroundColor};
      background-color: ${(props) => props.theme.color};
    }
  }
`;

const StyledDropdownMenu = styled(Dropdown.Menu)`
  --bs-dropdown-link-active-color: #000000;
  --bs-dropdown-link-active-bg: #d7d7d7;
  --bs-dropdown-link-hover-bg: #eaeaea;
  font-size: ${(props) => props.theme.fontSize};
  padding: ${(props) => props.theme.padding};
  --bs-dropdown-bg: #ffffff;
`;

/**
 * 기본 드롭다운 컴포넌트
 */
export const CustomDropdown = ({
  size = "medium",
  backgroundColor = "transparent",
  color = "#1e1e1e",
  initText,
  id,
  items,
  itemAlign = "end",
  onClickItemHandler,
  title,
  align = "right",
  customToggle,
  ...props
}: CustomDropdownProps) => {
  const [selectedText, setSelectedText] = useState(initText);
  const [currentBackgroundColor, setCurrentBackgroundColor] =
    useState(backgroundColor);
  const [currentColor, setCurrentColor] = useState(color);
  const rerenderData = useRecoilValue(rerenderDataState);

  useEffect(() => {
    if (initText) setSelectedText(initText);
  }, [rerenderData]);

  const theme = {
    backgroundColor: currentBackgroundColor,
    color: currentColor,
    fontSize:
      size === "large" ? "1rem" : size === "medium" ? "0.9rem" : "0.8rem",
    padding:
      size === "large"
        ? "0.3rem 0.5rem"
        : size === "medium"
        ? "0.3rem 0.45rem"
        : "0.3rem 0.4rem",
  };

  const makeItemComponents = () => {
    return (
      <StyledDropdownMenu
        renderOnMount={true}
        style={{
          marginTop: "0.2rem",
          borderWidth: "0",
          padding: "0.5rem 0",
          boxShadow: "0.05rem 0.05rem 0.2rem 0.05rem #9d9d9d11",
        }}
      >
        {items &&
          items.map((item) => (
            <Dropdown.Item
              href={item["href"]}
              key={item["key"]}
              eventKey={item["key"]}
              onClick={() => {
                setSelectedText(item["label"]);
                if (item["refData"]) onClickItemHandler(item["refData"]);
                else onClickItemHandler(item["key"]);
                if (item["backgroundColor"])
                  setCurrentBackgroundColor(item["backgroundColor"]);
                if (item["color"]) setCurrentColor(item["color"]);
              }}
            >
              <div
                dangerouslySetInnerHTML={{ __html: item["label"] }}
                style={{ overflow: "hidden", textOverflow: "ellipsis" }}
              ></div>
            </Dropdown.Item>
          ))}
      </StyledDropdownMenu>
    );
  };

  return (
    <SSRProvider>
      <StyledDropdown
        align={itemAlign}
        style={{ float: align, width: customToggle ? "inherit" : "auto" }}
        {...props}
      >
        <span style={{ verticalAlign: "middle" }}>{title}</span>
        {customToggle ? (
          <ThemeProvider theme={theme}>
            {
              <div className={id}>
                {items && items?.length > 0 ? (
                  <style>{`
                    .${id} .dropdown-menu {
                      display: block;
                      margin-left: -0rem;
                      width: calc(100% + 0rem);
                  }`}</style>
                ) : (
                  <style>{`
                    .${id} .dropdown-menu {display: none;
                  }`}</style>
                )}
                <Dropdown.Header id={id}>{customToggle}</Dropdown.Header>
                {makeItemComponents()}
              </div>
            }
          </ThemeProvider>
        ) : (
          <>
            <ThemeProvider theme={theme}>
              <StyledDropdownToggle variant="primary" id={id}>
                {selectedText}
              </StyledDropdownToggle>
            </ThemeProvider>
            <ThemeProvider theme={theme}>{makeItemComponents()}</ThemeProvider>
          </>
        )}
      </StyledDropdown>
    </SSRProvider>
  );
};
