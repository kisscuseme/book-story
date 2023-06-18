import React, { ChangeEvent, forwardRef, useEffect, useState } from "react";
import { FormControl, FormControlProps } from "react-bootstrap";
import { ChangeHandler, FieldValues, UseFormSetValue } from "react-hook-form";
import { styled } from "styled-components";

// 삭제 버튼 스타일 정의
const ClearButton = styled.button`
  position: absolute;
  font-weight: 700;
  border: none;
  color: #9e9e9e;
  background-color: transparent;
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      color: #6e6e6e;
    }
  }
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
    color: #afafaf;
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
  clearButton?: UseFormSetValue<FieldValues> | boolean | (() => void);
}

type CustomInputProps = CustomInputOwnProps & FormControlProps;

export const CustomInput = forwardRef(
  (
    { onChange, clearButton, ...props }: CustomInputProps,
    ref: React.ForwardedRef<HTMLInputElement>
  ) => {
    const [text, setText] = useState("");
    const wrapperStyle = {
      borderBottom: "1px solid #000000",
      paddingRight: `${clearButton && text ? "1.3rem" : "0"}`,
    };
    let inputRef: HTMLInputElement | null = null;

    const onChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e);
      setText(e.currentTarget.value);
    };

    const refHandler = (target: HTMLInputElement) => {
      if(target) {
        if (typeof ref === "function") ref(target);
        if (!inputRef) inputRef = target;
        if (target.value === "" && text !== "") setText("");
        if (target.value !== "" && text === "") setText(target.value);
      }
    };

    return (
      <div style={wrapperStyle}>
        <CustomFormControl
          ref={refHandler}
          onChange={onChangeHandler}
          {...props}
        />
        {clearButton && text && (
          <ClearButton
            type="button"
            tabIndex={-1}
            onClick={() => {
              setText("");
              if (inputRef) {
                inputRef.value = "";
                // react hook form을 사용할 경우 setValue 함수를 참조하여 값 초기화에 사용
                if(typeof clearButton === "function") clearButton(inputRef.name, "");
              }
            }}
          >
            x
          </ClearButton>
        )}
      </div>
    );
  }
);
CustomInput.displayName = "CustomInput";
