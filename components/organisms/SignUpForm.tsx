"use client";

import { signUp } from "@/services/firebase/auth";
import {
  emailRegEx,
  getCookie,
  getErrorMsg,
  l,
  setCookie,
} from "@/services/util/util";
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
import { object, string } from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

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
    name: string().required(l("Enter your name, please.")),
    password: string()
      .required(l("Please enter your password."))
      .min(6, l("Please enter a password of at least 6 digits.")),
    reconfirmPassword: string().test(
      "check-reconfirm-password",
      l("The entered password and reconfirm password are not the same."),
      (reconfirmPassword: string | undefined) => {
        const password = getValues().password;
        if (reconfirmPassword && reconfirmPassword === password) return true;
      }
    ),
  });
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) }); // react hook form 기능 활용
  const submitRef = useRef<HTMLButtonElement>(null);
  const rerenderData = useRecoilValue(rerenderDataState);
  const [disabledEmailDomain, setDisabledEmailDomain] = useState(false);

  useEffect(() => {
    const emailUser = getValues().email.user;
    if(emailUser) {
      const splitUser = emailUser.split("@");
      setValue("email.user", splitUser[0]);
      if(splitUser.length > 1 && splitUser[1]) setValue("email.domain", splitUser[1]);
    }
  },[watch('email.user')]);

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
            `${registerInfo.email.user}@${registerInfo.email.domain}`
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
          `${data.email.user}@${data.email.domain}`,
          data.password
        );
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
            id="signUpEmailSelector"
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
            {...register("name")}
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
          <CustomInput
            {...register("reconfirmPassword")}
            placeholder={reconfirmPasswordPlaceholder}
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
            {signUpButtonText}
          </CustomButton>
        </DefaultCol>
      </DefaultRow>
      <DefaultRow>
        <CenterCol>
          <div style={{ color: "hotpink" }}>
            {getErrorMsg(errors, "email.user", "required") ||
              getErrorMsg(errors, "email.domain", "required") ||
              getErrorMsg(errors, "email.domain", "check-format-domain") ||
              getErrorMsg(errors, "name", "required") ||
              getErrorMsg(errors, "password", "required") ||
              getErrorMsg(errors, "password", "min") ||
              getErrorMsg(
                errors,
                "reconfirmPassword",
                "check-reconfirm-password"
              )}
          </div>
        </CenterCol>
      </DefaultRow>
    </Form>
  );
}
