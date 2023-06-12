import React, {
  ChangeEvent,
  HTMLProps,
  ReactNode,
  RefObject,
  forwardRef,
  useEffect,
  useRef,
  useState,
} from "react";
import { FormControl, FormControlProps } from "react-bootstrap";
import { styled } from "styled-components";

interface InputOwnProps {
  /**
   * 타입
   */
  type?: string;
  /**
   * clear button ref
   */
  clearBtnRef?: RefObject<HTMLButtonElement>;
  /**
   * onClearButtonClick
   */
  onClearButtonClick?: (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => void;
  /**
   * initValue
   */
  initValue?: string;
}

type InputProps = InputOwnProps &
  FormControlProps &
  HTMLProps<HTMLInputElement>;

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
  &:focus {
    box-shadow: unset;
    background-color: transparent;
  }
  &::placeholder {
    color: #afafaf;
  }
`;

/**
 * 기본 인풋 컴포넌트
 * forwardRef 옵트인기능 활용
 * 참고: https://ko.legacy.reactjs.org/docs/forwarding-refs.html
 */
export const CustomInput = forwardRef(
  (
    { ...props }: FormControlProps,
    ref: React.ForwardedRef<HTMLInputElement>
  ) => {
    return <CustomFormControl ref={ref} {...props} />;
  }
);
CustomInput.displayName = "CustomInput";

export const InputWrapper = ({
  children,
  clearButton = false,
}: {
  children: ReactNode;
  clearButton?: boolean;
}) => {
  const wrapperStyle = {
    borderBottom: "1px solid #000000",
    paddingRight: `${clearButton ? "25px" : "0"}`,
  };

  return <div style={wrapperStyle}>{children}</div>;
};

interface ClearInputOwnProps {
  clearButton?: boolean;
  ref?: React.ForwardedRef<HTMLInputElement>
}

type ClearInputProps = ClearInputOwnProps & FormControlProps;

export const ClearInput = ({
  clearButton = true,
  ...props
}: ClearInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  return (
    <InputWrapper clearButton={clearButton}>
      <CustomInput
        ref={inputRef}
        onChange={(e) => {
          setText(e.currentTarget.value);
        }}
        {...props}
      />
      {clearButton && text && (
        <ClearButton
          onClick={() => {
            if (inputRef.current) {
              setText("");
              inputRef.current.value = "";
            }
          }}
        >
          X
        </ClearButton>
      )}
    </InputWrapper>
  );
};
ClearInput.displayName = "ClearInput";
