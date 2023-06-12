"use client";

import { signUp } from "@/services/firebase/auth";
import { emailRegEx, getErrorMsg, l, setCookie } from "@/services/util/util";
import { showModalState } from "@/states/states";
import { useMutation } from "@tanstack/react-query";
import {
  sendEmailVerification,
  updateProfile,
  UserCredential,
} from "firebase/auth";
import { KeyboardEvent, useRef, useState } from "react";
import { Form } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useSetRecoilState } from "recoil";
import { DefaultCol, DefaultRow } from "../atoms/DefaultAtoms";
import { CustomInput, InputWrapper } from "../atoms/CustomInput";
import { CenterCol } from "../atoms/CustomAtoms";
import TranslationFromClient from "./TranslationFromClient";
import { CustomButton } from "../atoms/CustomButton";

// sign up form props
export interface SignUpFormProps {
  emailPlaceholder: string;
  namePlaceholder: string;
  passwordPlaceholder: string;
  reconfirmPasswordPlaceholder: string;
  signUpButtonText: string;
}

export default function SignUpForm({
  emailPlaceholder,
  namePlaceholder,
  passwordPlaceholder,
  reconfirmPasswordPlaceholder,
  signUpButtonText,
}: SignUpFormProps) {
  const setShowModal = useSetRecoilState(showModalState);
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm(); // react hook form 기능 활용
  const submitRef = useRef<HTMLButtonElement>(null);

  // 계정 생성 시 react query 활용
  const signUpMutation = useMutation(signUp, {
    onSuccess: async (data: UserCredential | string) => {
      try {
        const registerInfo = getValues();
        if (typeof data === "string") {
          // 가져온 데이터가 string type일 경우 에러 메시지임
          setShowModal({
            show: true,
            title: l("Check"),
            content: data,
          });
        } else {
          // 입력한 name 값으로 displayName 값 수정
          await updateProfile(data.user, { displayName: registerInfo.name });
          // 인증 메일 전송
          await sendEmailVerification(data.user);
          // 이메일 정보 쿠키에 저장
          setCookie("email", registerInfo.email);
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
        setShowModal({
          show: true,
          title: l("Check"),
          content: l(error.message),
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
        signUpHandleSubmit(data.email, data.password);
      })}
    >
      <TranslationFromClient />
      <DefaultRow>
        <DefaultCol>
          <InputWrapper>
            <CustomInput
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
            />
          </InputWrapper>
        </DefaultCol>
      </DefaultRow>
      <DefaultRow>
        <DefaultCol>
          <InputWrapper>
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
            />
          </InputWrapper>
        </DefaultCol>
      </DefaultRow>
      <DefaultRow>
        <DefaultCol>
          <InputWrapper>
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
            />
          </InputWrapper>
        </DefaultCol>
      </DefaultRow>
      <DefaultRow>
        <DefaultCol>
          <InputWrapper>
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
            />
          </InputWrapper>
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
            {getErrorMsg(errors, "email", "required") ||
              getErrorMsg(errors, "email", "pattern") ||
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
