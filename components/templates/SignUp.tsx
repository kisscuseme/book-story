import { getCookie, l } from "@/services/util/util";
import SignUpForm from "../organisms/SignUpForm";
import { DefaultContainer, DefaultTitle } from "../atoms/DefaultAtoms";
import { TopBar } from "../molecules/TopBar";
import { LanguageSelectorForServer } from "../organisms/LanguageSelectorForServer";

export default function SignUp() {
  return (
    <DefaultContainer>
      <TopBar>
        {/* 서버에서 번역을 적용하기 위한 컴포넌트 */}
        <LanguageSelectorForServer
          langForServer={getCookie("lang") || "kr"}
        />
      </TopBar>
      <DefaultTitle>{l("Create an account")}</DefaultTitle>
      <SignUpForm
        emailPlaceholder={l("E-mail")}
        namePlaceholder={l("Name")}
        passwordPlaceholder={l("Password")}
        reconfirmPasswordPlaceholder={l("Reconfirm Password")}
        signUpButtonText={l("Create")}
      />
    </DefaultContainer>
  );
}
