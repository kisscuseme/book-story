"use client";

import { showToastState } from "@/states/states";
import React, { useEffect, useRef, useState } from "react";
import { useRecoilState } from "recoil";
import { Toast, ToastContainer } from "react-bootstrap";
import { CSSTransition } from "react-transition-group";

// Alert 기능을 전역적으로 사용하기 위한 컴포넌트
export default function ShowToast() {
  const [showToast, setShowToast] = useRecoilState(showToastState);
  const [startAnimation, setStartAnimation] = useState(false);
  const nodeRef = useRef(null);

  useEffect(() => {
    if (showToast.show) {
      setStartAnimation(true);
    }
  }, [showToast]);

  useEffect(() => {
    if (startAnimation) {
      setTimeout(() => {
        setStartAnimation(false);
        setTimeout(() => {
          setShowToast({ show: false });
        }, 500);
      }, showToast.delay || 3000);
    }
  }, [startAnimation]);

  return (
    <>
      <style>
        {`
          .toast-enter {
            opacity: 0;
          }
          .toast-enter-active {
            opacity: 1;
            transition: opacity 300ms ease-in;
          }
          .toast-exit {
            opacity: 1;
          }
          .toast-exit-active {
            opacity: 0;
            transition: opacity 300ms ease-in;
          }
        `}
      </style>
      <CSSTransition
        in={startAnimation}
        nodeRef={nodeRef}
        timeout={300}
        unmountOnExit
        classNames="toast"
      >
        <ToastContainer
          className="p-3"
          position={"top-center"}
          style={{ zIndex: 1, position: "fixed" }}
          ref={nodeRef}
        >
          <Toast
            onClose={() => setShowToast({ show: false })}
            show={showToast.show}
            animation={false}
            style={{
              textAlign: "center",
              width: "fit-content",
              padding: "0px 10px",
              borderWidth: "0",
              backgroundColor: "#333333",
              color: "#eeeeee",
            }}
          >
            {showToast.title && <Toast.Header>{showToast.title}</Toast.Header>}
            {showToast.content && <Toast.Body>{showToast.content}</Toast.Body>}
          </Toast>
        </ToastContainer>
      </CSSTransition>
    </>
  );
}
