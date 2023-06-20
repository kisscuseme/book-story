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
import { FieldValues, useForm } from "react-hook-form";
import { DefaultCol, DefaultRow, GroupButton } from "../atoms/DefaultAtoms";
import { CenterCol } from "../atoms/CustomAtoms";
import TranslationFromClient from "./TranslationFromClient";
import { CustomButton } from "../atoms/CustomButton";
import { styled } from "styled-components";
import { CustomInput } from "../atoms/CustomInput";
import { CustomDropdown } from "../atoms/CustomDropdown";
import { object, string } from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

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
  const schema = object({
    email: object().shape({
      user: string().required(l("Please enter your e-mail.")),
      domain: string()
        .required(l("Please enter your e-mail."))
        .test(
          "check-format-domain",
          l("Please check your email format."),
          (domain: string) => {
            const user = getValues().email.user;
            if (emailRegEx.test(`${user}@${domain}`)) {
              return true;
            }
          }
        ),
    }),
    password: string()
      .required(l("Please enter your password."))
      .min(6, l("Please enter a password of at least 6 digits.")),
  });
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) }); // react hook form 기능 활용
  const submitRef = useRef<HTMLButtonElement>(null);
  const rerenderData = useRecoilValue(rerenderDataState);
  const [disabledEmailDomain, setDisabledEmailDomain] = useState(false);
  const [passwordType, setPasswordType] = useState("password");

  useEffect(() => {
    // 최초 로딩 시 input 컴포넌트 값에 기존 로그인 이메일 바인딩
    if (savedEmail) {
      const email = savedEmail.split("@");
      setValue("email.user", email[0]);
      setValue("email.domain", email[1]);
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
    console.log(data);
    const email = `${data.email.user}@${data.email.domain}`;
    if (email === "@") {
      setErrorMsg("Please enter your e-mail.");
    } else if (!checkEmail(email)) {
      setErrorMsg("Please check your email format.");
    } else {
      try {
        setShowModal({
          show: true,
          title: l("Check"),
          content: l("Would you like to send a password reset e-mail to ?", {
            email: email,
          }),
          confirm: () => {
            resetPasswordMutation.mutate(email);
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
          email: `${data.email.user}@${data.email.domain}`,
          password: data.password,
        });
      })}
    >
      <TranslationFromClient />
      <DefaultRow>
        <DefaultCol style={{ paddingRight: "0" }}>
          <CustomInput
            {...register("email.user")}
            placeholder={"user"}
            type="text"
            onKeyUp={(e: KeyboardEvent<HTMLInputElement>) => {
              enterKeyUpEventHandler(e);
            }}
            clearButton={setValue}
          />
        </DefaultCol>
        <DefaultCol
          style={{
            maxWidth: "0.8rem",
            paddingLeft: "0.4rem",
            paddingRight: "0",
          }}
        >
          <div style={{ color: "#5f5f5f" }}>@</div>
        </DefaultCol>
        <DefaultCol
          style={{
            maxWidth: "30%",
            minWidth: "7.5rem",
            paddingRight: "0.3rem",
          }}
        >
          <CustomInput
            {...register("email.domain")}
            placeholder={"example.com"}
            type="text"
            onKeyUp={(e: KeyboardEvent<HTMLInputElement>) => {
              enterKeyUpEventHandler(e);
            }}
            disabled={disabledEmailDomain}
            clearButton={disabledEmailDomain ? false : setValue}
          />
        </DefaultCol>
        <DefaultCol
          style={{
            maxWidth: `${getCookie("lang") !== "en" ? "6rem" : "8rem"}`,
          }}
        >
          <CustomDropdown
            id="signInEmailSelector"
            onClickItemHandler={(label) => {
              // console.log(label);
              if (label === "Enter directly") setDisabledEmailDomain(false);
              else {
                setValue("email.domain", label);
                setDisabledEmailDomain(true);
              }
            }}
            itemAlign="end"
            align="right"
            initText={emailEnterDirectly}
            backgroundColor="#323232"
            color="#f8f8f8"
            items={[
              {
                key: "Enter directly",
                label: emailEnterDirectly,
                href: "#",
                color: "#f8f8f8",
                backgroundColor: "#323232",
              },
              {
                key: "gmail.com",
                label: "Gmail",
                href: "#",
                color: "#f8f8f8",
                backgroundColor: "#d64a2e",
              },
              {
                key: "naver.com",
                label: "Naver",
                href: "#",
                color: "#f8f8f8",
                backgroundColor: "#32ad13",
              },
              {
                key: "hotmail.com",
                label: "Hotmail",
                href: "#",
                color: "#f8f8f8",
                backgroundColor: "#fb7623",
              },
              {
                key: "daum.com",
                label: "Daum",
                href: "#",
                color: "#f8f8f8",
                backgroundColor: "#337dfc",
              },
              {
                key: "hanmail.net",
                label: "Hanmail",
                href: "#",
                color: "#f8f8f8",
                backgroundColor: "#337dfc",
              },
              {
                key: "nate.com",
                label: "Nate",
                href: "#",
                color: "#f8f8f8",
                backgroundColor: "#ff1e1e",
              },
              {
                key: "kakao.com",
                label: "Kakao",
                href: "#",
                color: "#f8f8f8",
                backgroundColor: "#ffad29",
              },
              {
                key: "yahoo.co.kr",
                label: "Yahoo",
                href: "#",
                color: "#f8f8f8",
                backgroundColor: "#8d3bff",
              },
            ]}
          />
        </DefaultCol>
      </DefaultRow>
      <DefaultRow>
        <DefaultCol>
          <CustomInput
            {...register("password")}
            placeholder={passwordPlaceholder}
            type="password"
            onKeyUp={(e: KeyboardEvent<HTMLInputElement>) => {
              enterKeyUpEventHandler(e);
            }}
            clearButton={setValue}
            passwordVisibleButton={true}
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
              getErrorMsg(errors, "email.domain", "required") ||
              getErrorMsg(errors, "email.domain", "check-format-domain") ||
              getErrorMsg(errors, "password", "required") ||
              getErrorMsg(errors, "password", "min") ||
              l(errorMsg)}
          </div>
        </CenterCol>
      </DefaultRow>
    </Form>
  );
};
