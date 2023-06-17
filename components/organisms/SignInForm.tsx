"use client";

import { Form, Row } from "react-bootstrap";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  checkEmail,
  emailRegEx,
  getCookie,
  getErrorMsg,
  l,
  setCookie,
} from "@/services/util/util";
import { firebaseAuth } from "@/services/firebase/firebase";
import { sendEmailVerification, sendPasswordResetEmail } from "firebase/auth";
import { useRecoilValue, useSetRecoilState } from "recoil";
import {
  rerenderDataState,
  showModalState,
  showToastState,
} from "@/states/states";
import { signIn } from "@/services/firebase/auth";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { DefaultCol, DefaultRow, GroupButton } from "../atoms/DefaultAtoms";
import { CenterCol } from "../atoms/CustomAtoms";
import TranslationFromClient from "./TranslationFromClient";
import { CustomButton } from "../atoms/CustomButton";
import { styled } from "styled-components";
import { CustomInput } from "../atoms/CustomInput";
import { CustomDropdown } from "../atoms/CustomDropdown";
import { getNLBooksData } from "@/services/api/books";

// sign in form props
export interface SignInFormProps {
  emailEnterDirectly: string;
  passwordPlaceholder: string;
  signInButtonText: string;
  resetPasswordButtonText: string;
  signUpButtonText: string;
}

// 그룹 버튼을 위한 Row
const SignInGroupButtonRow = styled(Row)`
  min-height: 120px;
`;

// 그룹 버튼 중앙 정렬
const GroupButtonWrapper = styled.div`
  width: 100%;
  text-align: center;
`;

export const SignInForm = ({
  emailEnterDirectly,
  passwordPlaceholder,
  signInButtonText,
  resetPasswordButtonText,
  signUpButtonText,
}: SignInFormProps) => {
  const [errorMsg, setErrorMsg] = useState("");
  const setShowModal = useSetRecoilState(showModalState);
  const setShowToast = useSetRecoilState(showToastState);
  const savedEmail = getCookie("email") || "";
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm(); // react hook form 기능 활용
  const submitRef = useRef<HTMLButtonElement>(null);
  const rerenderData = useRecoilValue(rerenderDataState);
  const [disabledEmailAddress, setDisabledEmailAddress] = useState(false);

  useEffect(() => {
    // 최초 로딩 시 input 컴포넌트 값에 기존 로그인 이메일 바인딩
    if (savedEmail) {
      const email = savedEmail.split("@");
      setValue("email.user", email[0]);
      setValue("email.address", email[1]);
    }
  }, []);

  useEffect(() => {}, [rerenderData]);

  // 로그인 시 react query 활용
  const signInMutation = useMutation(signIn, {
    onSuccess(data) {
      if (typeof data !== "string") {
        // form 필드 값 클리어
        reset();
        // 이메일 인증이 된 경우만 로그인 허용
        if (data.user.emailVerified) {
          // 로그인 성공한 이메일 쿠키에 저장
          setCookie("email", data.user.email || "");
          // 루트 페이지로 이동하여 로그인 여부 체크 후 진입
          window.location.href = "/";
        } else {
          setShowModal({
            show: true,
            title: l("Check"),
            content: `${l("E-mail verification has not been completed.")} ${l(
              "Would you like to resend the verification e-mail?"
            )}`,
            confirm: async () => {
              setShowModal({
                show: false,
              });
              try {
                await sendEmailVerification(data.user);
                setShowToast({
                  show: true,
                  content:
                    "Resending of verification e-mail has been completed.",
                });
              } catch (error: any) {
                let message;
                if (error.code === "auth/too-many-requests") {
                  message = `${l("Lots of attempts.")} ${l(
                    "Please try again later."
                  )}`;
                } else {
                  message = error.message;
                }
                setShowToast({
                  show: true,
                  content: message,
                });
              }
            },
          });
        }
      } else {
        setShowModal({
          show: true,
          title: l("Check"),
          content: l(data),
        });
      }
    },
    onError(error: any) {
      setShowToast({
        show: true,
        content: l(error),
      });
    },
  });

  const resetPassword = async (email: string) => {
    try {
      return await sendPasswordResetEmail(firebaseAuth, email);
    } catch (error: any) {
      setShowToast({
        show: true,
        content:
          `${l("An error occurred while sending e-mail.")}\n` + error.message,
      });
    }
  };

  const resetPasswordMutation = useMutation(resetPassword, {
    onError: (error: any) => {
      let message;
      if (error.code === "auth/too-many-requests") {
        message = `${l("Lots of attempts.")} ${l("Please try again later.")}`;
      } else {
        message = error.message;
      }
      setShowToast({
        show: true,
        content: message,
      });
    },
    onSuccess: () => {
      setShowToast({
        show: true,
        content: l("E-mail sending has been completed."),
      });
    },
  });

  const resetPasswordClickHandler = () => {
    const data = getValues();
    if (data.email === "") {
      setErrorMsg("Please enter your e-mail.");
    } else if (!checkEmail(data.email)) {
      setErrorMsg("Please check your email format.");
    } else {
      try {
        setShowModal({
          show: true,
          title: l("Check"),
          content: l("Would you like to send a password reset e-mail to ?", {
            email: data.email,
          }),
          confirm: () => {
            resetPasswordMutation.mutate(data.email);
          },
        });
      } catch (error: any) {
        setShowToast({
          show: true,
          content: l(error.message),
        });
      }
    }
  };

  const signUpClickHandler = () => {
    window.location.href = "/signup";
  };

  // 엔터 입력 시 버튼 클릭 효과
  const enterKeyUpEventHandler = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      submitRef.current?.click();
    }
  };

  return (
    <Form
      onSubmit={handleSubmit((data) => {
        setErrorMsg("");
        signInMutation.mutate({
          email: `${data.email.user}@${data.email.address}`,
          password: data.password,
        });
      })}
    >
      <TranslationFromClient />
      <DefaultRow>
        <DefaultCol style={{ paddingRight: "0" }}>
          <CustomInput
            {...register("email.user", {
              required: {
                value: true,
                message: l("Please enter your e-mail."),
              },
              validate: (value) => {
                const address = getValues().email.address;
                if (emailRegEx.test(`${value}@${address}`)) {
                  return true;
                } else {
                  return l("Please check your email format.");
                }
              },
            })}
            placeholder={"user"}
            type="text"
            onKeyUp={(e: KeyboardEvent<HTMLInputElement>) => {
              enterKeyUpEventHandler(e);
            }}
            clearButton={setValue}
          />
        </DefaultCol>
        <DefaultCol
          style={{ maxWidth: "3%", paddingLeft: "0.3rem", paddingRight: "0" }}
        >
          <div style={{ color: "#5f5f5f" }}>@</div>
        </DefaultCol>
        <DefaultCol
          style={{ maxWidth: "7rem", paddingRight: "0.3rem" }}
        >
          <CustomInput
            {...register("email.address", {
              required: {
                value: true,
                message: l("Please enter your e-mail."),
              },
              validate: (value) => {
                const user = getValues().email.user;
                if (emailRegEx.test(`${user}@${value}`)) {
                  return true;
                } else {
                  return l("Please check your email format.");
                }
              },
            })}
            placeholder={"example.com"}
            type="text"
            onKeyUp={(e: KeyboardEvent<HTMLInputElement>) => {
              enterKeyUpEventHandler(e);
            }}
            disabled={disabledEmailAddress}
            clearButton={disabledEmailAddress ? false : setValue}
          />
        </DefaultCol>
        <DefaultCol style={{ maxWidth: "8rem" }}>
          <CustomDropdown
            id="signInEmailSelector"
            onClickItemHandler={(label) => {
              // console.log(label);
              if (label === "Enter directly") setDisabledEmailAddress(false);
              else {
                setValue("email.address", label);
                setDisabledEmailAddress(true);
              }
            }}
            itemAlign="end"
            align="right"
            initText={emailEnterDirectly}
            backgroundColor="#f8f8f8"
            items={[
              {
                key: "Enter directly",
                label: emailEnterDirectly,
                href: "#",
                color: "#323232",
                backgroundColor: "#f8f8f8",
              },
              {
                key: "gmail.com",
                label: "gmail.com",
                href: "#",
                color: "#d64a2e",
                backgroundColor: "#f8f8f8",
              },
              {
                key: "naver.com",
                label: "naver.com",
                href: "#",
                color: "#32ad13",
                backgroundColor: "#f8f8f8",
              },
              {
                key: "hotmail.com",
                label: "hotmail.com",
                href: "#",
                color: "#fb7623",
                backgroundColor: "#f8f8f8",
              },
              {
                key: "daum.com",
                label: "daum.com",
                href: "#",
                color: "#337dfc",
                backgroundColor: "#f8f8f8",
              },
              {
                key: "hanmail.net",
                label: "hanmail.net",
                href: "#",
                color: "#337dfc",
                backgroundColor: "#f8f8f8",
              },
              {
                key: "nate.com",
                label: "nate.com",
                href: "#",
                color: "#ff1e1e",
                backgroundColor: "#f8f8f8",
              },
              {
                key: "kakao.com",
                label: "kakao.com",
                href: "#",
                color: "#ffad29",
                backgroundColor: "#f8f8f8",
              },
              {
                key: "yahoo.co.kr",
                label: "yahoo.co.kr",
                href: "#",
                color: "#8d3bff",
                backgroundColor: "#f8f8f8",
              },
            ]}
          />
        </DefaultCol>
      </DefaultRow>
      <DefaultRow>
        <DefaultCol>
          <CustomInput
            {...register("password", {
              required: {
                value: true,
                message: l("Please enter your password."),
              },
              minLength: {
                value: 6,
                message: l("Please enter a password of at least 6 digits."),
              },
            })}
            placeholder={passwordPlaceholder}
            type="password"
            onKeyUp={(e: KeyboardEvent<HTMLInputElement>) => {
              enterKeyUpEventHandler(e);
            }}
            clearButton={setValue}
          />
        </DefaultCol>
      </DefaultRow>
      <DefaultRow>
        <DefaultCol>
          <CustomButton ref={submitRef} type="submit">
            {signInButtonText}
          </CustomButton>
        </DefaultCol>
      </DefaultRow>
      <SignInGroupButtonRow>
        <CenterCol>
          <GroupButtonWrapper>
            <GroupButton
              type="button"
              onClick={resetPasswordClickHandler}
              align="center"
              color="#5f5f5f"
            >
              {resetPasswordButtonText}
            </GroupButton>
            <GroupButton
              type="button"
              onClick={signUpClickHandler}
              align="center"
              color="#5f5f5f"
            >
              {signUpButtonText}
            </GroupButton>
          </GroupButtonWrapper>
        </CenterCol>
      </SignInGroupButtonRow>
      <DefaultRow>
        <CenterCol>
          <div style={{ color: "hotpink" }}>
            {getErrorMsg(errors, "email.user", "required") ||
              getErrorMsg(errors, "email.user", "validate") ||
              getErrorMsg(errors, "email.address", "required") ||
              getErrorMsg(errors, "email.address", "validate") ||
              getErrorMsg(errors, "password", "required") ||
              getErrorMsg(errors, "password", "minLength") ||
              l(errorMsg)}
          </div>
        </CenterCol>
      </DefaultRow>
    </Form>
  );
};
