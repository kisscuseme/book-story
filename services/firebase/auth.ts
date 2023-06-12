import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { l } from "../util/util";
import { firebaseAuth } from "./firebase";

// firebase 로그인 기능
const signIn = async (loginInfo: {
  email: string;
  password: string;
}) => {
  try {
    const curUserInfo = await signInWithEmailAndPassword(
      firebaseAuth,
      loginInfo.email,
      loginInfo.password
    );
    return curUserInfo;
  } catch (error: any) {
    switch (error.code) {
      case "auth/user-not-found":
      case "auth/wrong-password":
        throw "Your email address or password is incorrect.";
      default:
        throw "An error occurred while logging in." + "\n" + error.message;
    }
  }
};

// firebase 계정 생성 기능
const signUp = async (registerInfo: {
  email: string;
  password: string;
}) => {
  try {
    const createdUser = await createUserWithEmailAndPassword(
      firebaseAuth,
      registerInfo.email,
      registerInfo.password
    );
    return createdUser;
  } catch (error: any) {
    switch (error.code) {
      case "auth/weak-password":
        throw "Password must be 6 digits or longer.";
      case "auth/invalid-email":
        throw "Invalid email format.";
      case "auth/email-already-in-use":
        throw "This account has already been created.";
      default:
        throw (
          "An error occurred while creating an account." + "\n" + error.message
        );
    }
  }
};

// firebase 로그아웃 기능
const logOut = async () => {
  try {
    await signOut(firebaseAuth);
    return true;
  } catch (error: any) {
    throw l("An error occurred while logging out.") + "\n" + error.message;
  }
};

// 클라이언트에서 로그인 여부 체크가 필요한 경우
const checkLogin = async (): Promise<User | null> => {
  return new Promise((resolve) => {
    firebaseAuth.onAuthStateChanged((user) => {
      if (user && user.emailVerified) {
        resolve(user);
      } else {
        resolve(null);
      }
    })();
  });
};

export { signIn, signUp, logOut, checkLogin };
