"use client";

import { Form, Row } from "react-bootstrap";
import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  checkEmail,
  emailRegEx,
  getCookie,
  getErrorMsg,
  l,
  passwordRegEx,
  setCookie,
} from "@/services/util/util";
import { firebaseAuth } from "@/services/firebase/firebase";
import { sendEmailVerification, sendPasswordResetEmail } from "firebase/auth";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { rerenderDataState, showModalState } from "@/states/states";
import { signIn } from "@/services/firebase/auth";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { DefaultCol, DefaultRow, GroupButton } from "../atoms/DefaultAtoms";
import { CenterCol } from "../atoms/CustomAtoms";
import TranslationFromClient from "./TranslationFromClient";
import { CustomButton } from "../atoms/CustomButton";
import { styled } from "styled-components";
import { ClearInput } from "../atoms/CustomInput";

// sign in form props
export interface SignInFormProps {
  emailPlaceholder: string;
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
  emailPlaceholder,
  passwordPlaceholder,
  signInButtonText,
  resetPasswordButtonText,
  signUpButtonText,
}: SignInFormProps) => {
  const [errorMsg, setErrorMsg] = useState("");
  const setShowModal = useSetRecoilState(showModalState);
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

  useEffect(() => {
    // 최초 로딩 시 input 컴포넌트 값에 기존 로그인 이메일 바인딩
    setValue("email", savedEmail);
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
                setShowModal({
                  show: true,
                  title: l("Check"),
                  content: l(
                    "Resending of verification e-mail has been completed."
                  ),
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

                setShowModal({
                  show: true,
                  title: l("Check"),
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
      setShowModal({
        show: true,
        title: l("Check"),
        content: l(error),
      });
    },
  });

  const resetPassword = async (email: string) => {
    try {
      return await sendPasswordResetEmail(firebaseAuth, email);
    } catch (error: any) {
      setShowModal({
        show: true,
        title: l("Check"),
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
      setShowModal({
        show: true,
        title: l("Check"),
        content: message,
      });
    },
    onSuccess: () => {
      setShowModal({
        show: true,
        title: l("Check"),
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
        setShowModal({
          show: true,
          title: l("Check"),
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
        signInMutation.mutate({ email: data.email, password: data.password });
      })}
    >
      <TranslationFromClient />
      <DefaultRow>
        <DefaultCol>
          <ClearInput
            {...register("email", {
              required: {
                value: true,
                message: l("Please enter your e-mail."),
              },
              pattern: {
                value: emailRegEx,
                message: l("Please check your email format."),
              },
            })}
            placeholder={emailPlaceholder}
            type="email"
            onKeyUp={(e: KeyboardEvent<HTMLInputElement>) => {
              enterKeyUpEventHandler(e);
            }}
            clearValue={setValue}
            initValue={savedEmail}
          />
        </DefaultCol>
      </DefaultRow>
      <DefaultRow>
        <DefaultCol>
          <ClearInput
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
            clearValue={setValue}
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
            {getErrorMsg(errors, "email", "required") ||
              getErrorMsg(errors, "email", "pattern") ||
              getErrorMsg(errors, "password", "required") ||
              getErrorMsg(errors, "password", "minLength") ||
              l(errorMsg)}
          </div>
        </CenterCol>
      </DefaultRow>
    </Form>
  );
};
