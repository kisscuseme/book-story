import { getCookie, l } from "@/services/util/util";
import { cookies } from "next/dist/client/components/headers";
import { DefaultContainer, DefaultTitle } from "../atoms/DefaultAtoms";
import { TopBar } from "../molecules/TopBar";
import { LanguageSelectorForServer } from "../organisms/LanguageSelectorForServer";
import { SignInForm } from "../organisms/SignInForm";

export default function SignIn() {
  return (
    <DefaultContainer>
      <TopBar>
        {/* 서버에서 번역을 적용하기 위한 컴포넌트 */}
        <LanguageSelectorForServer
          langForServer={getCookie("lang") || "kr"}
        />
      </TopBar>
      <DefaultTitle>{l("Book Story")}</DefaultTitle>
      <SignInForm
        emailEnterDirectly={l("Enter directly")}
        passwordPlaceholder={`${l("Password")} (${l("6 or more letters or numbers")})`}
        signInButtonText={l("Sign In")}
        resetPasswordButtonText={l("Reset Password")}
        signUpButtonText={l("Sign Up")}
      />
    </DefaultContainer>
  );
}
