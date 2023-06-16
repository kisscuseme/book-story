"use client";

import {
  Dropdown,
  FormControl,
  FormControlProps,
  SSRProvider,
} from "react-bootstrap";
import { CSSProperties, Children, ForwardRefExoticComponent, ReactNode, RefAttributes, forwardRef, useEffect, useState } from "react";
import { DropdownProps } from "react-bootstrap";
import { AlignType } from "react-bootstrap/esm/types";
import { ThemeProvider, styled } from "styled-components";
import { useRecoilValue } from "recoil";
import { rerenderDataState } from "@/states/states";
import { CustomInput } from "./CustomInput";

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
  onClickItemHandler: (label: string) => void;
  /**
   * Title
   */
  title?: string;
  /**
   * custom menu
   */
  customMenu?: ForwardRefExoticComponent<CustomMenuProps & RefAttributes<HTMLInputElement>>;
}

export type CustomDropdownProps = DropdownOwnProps &
  Omit<DropdownProps, "align" | "children">;

export type DropdownDataProps = {
  key: string;
  href: string;
  label: string;
  backgroundColor?: string;
  color?: string;
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
  --bs-dropdown-link-active-color: #fff;
  --bs-dropdown-link-active-bg: #6e6e6e;
  font-size: ${(props) => props.theme.fontSize};
  padding: ${(props) => props.theme.padding};
`;

interface CustomMenuProps {
  children: ReactNode[];
  style: CSSProperties;
  className: string;
  "aria-labelledby": string;
}

export const CustomMenu = forwardRef(
  (
    { children, style, className, "aria-labelledby": labeledBy }: CustomMenuProps,
    ref: React.ForwardedRef<HTMLInputElement>
  ) => {
    const [value, setValue] = useState("");

    return (
      <div
        ref={ref}
        style={style}
        className={className}
        aria-labelledby={labeledBy}
      >
        <FormControl
          autoFocus
          className="mx-3 my-2 w-auto"
          placeholder="Type to filter..."
          onChange={(e) => setValue(e.target.value)}
          value={value}
        />
        <ul className="list-unstyled">
          {Children.toArray(children).filter(
            (child: any) =>
              !value || child.props.children.toLowerCase().startsWith(value)
          )}
        </ul>
      </div>
    );
  }
);
CustomMenu.displayName = "CustomMenu";

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
  customMenu,
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

  return (
    <SSRProvider>
      <StyledDropdown align={itemAlign} style={{ float: align }} {...props}>
        <span style={{ verticalAlign: "middle" }}>{title}</span>
        <ThemeProvider theme={theme}>
          <StyledDropdownToggle variant="primary" id={id}>
            {selectedText}
          </StyledDropdownToggle>
        </ThemeProvider>

        <ThemeProvider theme={theme}>
          <StyledDropdownMenu as={customMenu}>
            {items &&
              items.map((item) => (
                <Dropdown.Item
                  href={item["href"]}
                  key={item["key"]}
                  eventKey={item["key"]}
                  onClick={() => {
                    setSelectedText(item["label"]);
                    onClickItemHandler(item["key"]);
                    if (item["backgroundColor"])
                      setCurrentBackgroundColor(item["backgroundColor"]);
                    if (item["color"]) setCurrentColor(item["color"]);
                  }}
                >
                  {item["label"]}
                </Dropdown.Item>
              ))}
          </StyledDropdownMenu>
        </ThemeProvider>
      </StyledDropdown>
    </SSRProvider>
  );
};
