import { cookies } from "next/dist/client/components/headers";
import { admin } from "./firebase.admin";

// 서버에서 로그인 여부를 체크하는 경우
const checkLoginFromServer = async (): Promise<string | null> => {
  return new Promise(async (resolve) => {
    const token = await admin
      .auth()
      .verifyIdToken(cookies().get("token")?.value || "");
    if (token.uid) {
      resolve(token.uid);
    } else {
      resolve(null);
    }
  });
};

export { checkLoginFromServer };
