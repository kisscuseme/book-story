"use client";

import { CenterScreen } from "@/components/molecules/CenterScreen";
import { Spinner } from "react-bootstrap";

const LoadingPage = () => {
  return (
    <CenterScreen>
      <Spinner animation="border" />
    </CenterScreen>
  );
};

export default LoadingPage;
