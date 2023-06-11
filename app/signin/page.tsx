import SignIn from "@/components/templates/SignIn";
import { admin } from "@/services/firebase/firebase.admin";
import { cookies } from "next/dist/client/components/headers";
import Home from "../page";

const SignInPage = async () => {
  try {
    const token = await admin
        .auth()
        .verifyIdToken(cookies().get("token")?.value || "");
      if (token.uid !== "") {
        return <Home />
      } else {
        return <SignIn />;
      }
  } catch(error: any) {
    console.log(error);
    return <SignIn />
  }
};

export default SignInPage;
