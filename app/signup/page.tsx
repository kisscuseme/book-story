import { admin } from "@/services/firebase/firebase.admin";
import { cookies } from "next/dist/client/components/headers";
import Home from "../page";
import SignUp from "@/components/templates/SignUp";

const SignUpPage = async () => {
  try {
    const token = await admin
        .auth()
        .verifyIdToken(cookies().get("token")?.value || "");
      if (token.uid !== "") {
        return <Home />
      } else {
        return <SignUp />;
      }
  } catch(error: any) {
    console.log(error);
    return <SignUp />
  }
};

export default SignUpPage;
