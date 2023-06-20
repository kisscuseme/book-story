import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { ChangeEvent, forwardRef, useState } from "react";
import { FormControl, FormControlProps, Row } from "react-bootstrap";
import { UseFormSetValue } from "react-hook-form";
import { ThemeProvider, styled } from "styled-components";
import { DefaultCol } from "./DefaultAtoms";

// 삭제 버튼 스타일 정의
const InnerButton = styled.button`
  font-weight: 700;
  border: none;
  color: #9e9e9e;
  background-color: transparent;
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      color: #6e6e6e;
    }
  }
  right: ${props => props.theme.right}
`;

// 기본 Input 스타일 오버라이딩
const CustomFormControl = styled(FormControl)`
  display: inline-block;
  border: 0;
  outline-width: 0;
  background-color: transparent;
  width: 100%;
  padding: 0;
  border-radius: 0;
  padding: 0 0.3rem;
  &:focus {
    box-shadow: unset;
    background-color: transparent;
  }
  &::placeholder {
    color: ${(props) => props.theme.placeholderColor};
  }
  &:disabled {
    color: #515151;
    background-color: #e7e7e7;
    border-radius: 0.3rem;
  }
`;

/**
 * 기본 인풋 컴포넌트
 * forwardRef 옵트인기능 활용
 * 참고: https://ko.legacy.reactjs.org/docs/forwarding-refs.html
 */
interface CustomInputOwnProps {
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  clearButton?: UseFormSetValue<any> | boolean | (() => void);
  placeholderColor?: string;
  passwordVisibleButton?: boolean;
}

type CustomInputProps = CustomInputOwnProps & FormControlProps;

export const CustomInput = forwardRef(
  (
    {
      onChange,
      clearButton,
      placeholderColor,
      passwordVisibleButton,
      type,
      ...props
    }: CustomInputProps,
    ref: React.ForwardedRef<HTMLInputElement>
  ) => {
    const [text, setText] = useState("");
    const [inputType, setInputType] = useState(type);

    let buttonPadding = 0;

    if (text) {
      if (clearButton) buttonPadding += 1.3;
      if (passwordVisibleButton) buttonPadding += 1.5;
    }

    const wrapperStyle = {
      borderBottom: "1px solid #000000",
      margin: "0",
    };
    let inputRef: HTMLInputElement | null = null;

    const onChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e);
      setText(e.currentTarget.value);
    };

    const refHandler = (target: HTMLInputElement) => {
      if (target) {
        if (typeof ref === "function") ref(target);
        if (!inputRef) inputRef = target;
        if (target.value === "" && text !== "") setText("");
        if (target.value !== "" && text === "") setText(target.value);
      }
    };

    const theme = {
      placeholderColor: placeholderColor ? placeholderColor : "#afafaf",
    };

    const clearButtonTheme = {
      right: "none",
    };
    const passwordVisibleButtonTheme = {
      right: "none",
    };

    return (
      <Row style={wrapperStyle}>
        <DefaultCol style={{padding: "0"}}>
          <ThemeProvider theme={theme}>
            <CustomFormControl
              ref={refHandler}
              onChange={onChangeHandler}
              type={inputType}
              {...props}
            />
          </ThemeProvider>
        </DefaultCol>
        {passwordVisibleButton && text && (
          <DefaultCol style={{maxWidth: "1.5rem", paddingLeft: "0" }}>
            <ThemeProvider theme={passwordVisibleButtonTheme}>
              <InnerButton
                type="button"
                tabIndex={-1}
                onClick={() => {
                  if(passwordVisibleButton) {
                    if(inputType === "password") setInputType("text");
                    else setInputType("password");
                  }
                }}
              >
                {inputType === "password" ? <FontAwesomeIcon size="xs" icon={faEye}/> : <FontAwesomeIcon size="xs" icon={faEyeSlash}/>}
              </InnerButton>
            </ThemeProvider>
          </DefaultCol>
        )}
        {clearButton && text && (
          <DefaultCol style={{maxWidth: "2rem", paddingLeft: "0.7rem" }}>
            <ThemeProvider theme={clearButtonTheme}>
              <InnerButton
                type="button"
                tabIndex={-1}
                onClick={() => {
                  setText("");
                  if (inputRef) {
                    inputRef.value = "";
                    // react hook form을 사용할 경우 setValue 함수를 참조하여 값 초기화에 사용
                    if (typeof clearButton === "function")
                      clearButton(inputRef.name, "");
                  }
                }}
              >
                x
              </InnerButton>
            </ThemeProvider>
          </DefaultCol>
        )}
      </Row>
    );
  }
);
CustomInput.displayName = "CustomInput";
