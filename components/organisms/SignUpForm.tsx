"use client";

import { signUp } from "@/services/firebase/auth";
import { emailRegEx, getErrorMsg, l, setCookie } from "@/services/util/util";
import {
  rerenderDataState,
  showModalState,
  showToastState,
} from "@/states/states";
import { useMutation } from "@tanstack/react-query";
import {
  sendEmailVerification,
  updateProfile,
  UserCredential,
} from "firebase/auth";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { Form } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { DefaultCol, DefaultRow } from "../atoms/DefaultAtoms";
import { CenterCol } from "../atoms/CustomAtoms";
import TranslationFromClient from "./TranslationFromClient";
import { CustomButton } from "../atoms/CustomButton";
import { CustomInput } from "../atoms/CustomInput";
import { CustomDropdown } from "../atoms/CustomDropdown";

// sign up form props
export interface SignUpFormProps {
  emailEnterDirectly: string;
  namePlaceholder: string;
  passwordPlaceholder: string;
  reconfirmPasswordPlaceholder: string;
  signUpButtonText: string;
}

export default function SignUpForm({
  emailEnterDirectly,
  namePlaceholder,
  passwordPlaceholder,
  reconfirmPasswordPlaceholder,
  signUpButtonText,
}: SignUpFormProps) {
  const setShowModal = useSetRecoilState(showModalState);
  const setShowToast = useSetRecoilState(showToastState);
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

  useEffect(() => {}, [rerenderData]);

  // 계정 생성 시 react query 활용
  const signUpMutation = useMutation(signUp, {
    onSuccess: async (data: UserCredential | string) => {
      try {
        const registerInfo = getValues();
        if (typeof data === "string") {
          // 가져온 데이터가 string type일 경우 에러 메시지임
          setShowToast({
            show: true,
            content: data,
          });
        } else {
          // 입력한 name 값으로 displayName 값 수정
          await updateProfile(data.user, { displayName: registerInfo.name });
          // 인증 메일 전송
          await sendEmailVerification(data.user);
          // 이메일 정보 쿠키에 저장
          setCookie(
            "email",
            `${registerInfo.email.user}@${registerInfo.email.address}`
          );
          setShowModal({
            show: true,
            title: l("Check"),
            content: `${l("Your account creation is complete.")} ${l(
              "Please check the verification e-mail sent."
            )}`,
            callback: () => {
              reset();
              window.location.href = "/";
            },
          });
        }
      } catch (error: any) {
        setShowToast({
          show: true,
          content: l(error.message),
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

  const signUpHandleSubmit = (email: string, password: string) => {
    setShowModal({
      show: true,
      title: l("Check"),
      content: l("Would you like to create an account?"),
      confirm: () => {
        signUpMutation.mutate({ email, password });
      },
    });
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
        signUpHandleSubmit(
          `${data.email.user}@${data.email.address}`,
          data.password
        );
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
          style={{ maxWidth: "0.8rem", paddingLeft: "0.3rem", paddingRight: "0" }}
        >
          <div style={{ color: "#5f5f5f" }}>@</div>
        </DefaultCol>
        <DefaultCol
          style={{ maxWidth: "8rem", paddingRight: "0.3rem" }}
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
            id="signUpEmailSelector"
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
                label: "Yahoo Korea",
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
            {...register("name", {
              required: {
                value: true,
                message: l("Enter your name, please."),
              },
            })}
            placeholder={namePlaceholder}
            type="text"
            onKeyUp={(e: KeyboardEvent<HTMLInputElement>) => {
              enterKeyUpEventHandler(e);
            }}
            clearButton={setValue}
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
          <CustomInput
            {...register("reconfirmPassword", {
              required: {
                value: true,
                message: l(
                  "The entered password and reconfirm password are not the same."
                ),
              },
              validate: (value) => {
                const password = getValues()["password"];
                if (value === password) return true;
                else
                  return l(
                    "The entered password and reconfirm password are not the same."
                  );
              },
            })}
            placeholder={reconfirmPasswordPlaceholder}
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
            {signUpButtonText}
          </CustomButton>
        </DefaultCol>
      </DefaultRow>
      <DefaultRow>
        <CenterCol>
          <div style={{ color: "hotpink" }}>
            {getErrorMsg(errors, "email.user", "required") ||
              getErrorMsg(errors, "email.user", "validate") ||
              getErrorMsg(errors, "email.address", "required") ||
              getErrorMsg(errors, "email.address", "validate") ||
              getErrorMsg(errors, "name", "required") ||
              getErrorMsg(errors, "password", "required") ||
              getErrorMsg(errors, "password", "minWidth") ||
              getErrorMsg(errors, "reconfirmPassword", "required") ||
              getErrorMsg(errors, "reconfirmPassword", "validate")}
          </div>
        </CenterCol>
      </DefaultRow>
    </Form>
  );
}
