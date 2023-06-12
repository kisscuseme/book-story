"use client";

import { CustomSpinner } from "@/components/atoms/CustomAtoms";
import { CenterScreen } from "@/components/molecules/CenterScreen";

const LoadingPage = () => {
  return (
    <CenterScreen>
      <CustomSpinner animation="border" />
    </CenterScreen>
  );
};

export default LoadingPage;
