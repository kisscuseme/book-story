import { getCookie, l } from "@/services/util/util";
import SignUpForm from "../organisms/SignUpForm";
import {
  DefaultCol,
  DefaultContainer,
  DefaultTitle,
} from "../atoms/DefaultAtoms";
import { TopBar } from "../molecules/TopBar";
import { LanguageSelectorForServer } from "../organisms/LanguageSelectorForServer";

export default function SignUp() {
  return (
    <DefaultContainer style={{ maxWidth: "550px" }}>
      <TopBar>
        <DefaultCol>
          {/* 서버에서 번역을 적용하기 위한 컴포넌트 */}
          <LanguageSelectorForServer
            langForServer={getCookie("lang") || "kr"}
          />
        </DefaultCol>
      </TopBar>
      <DefaultTitle>{l("Create an account")}</DefaultTitle>
      <SignUpForm
        emailEnterDirectly={l("Enter directly")}
        namePlaceholder={l("Name")}
        passwordPlaceholder={`${l("Password")} (${l(
          "6 or more letters or numbers"
        )})`}
        reconfirmPasswordPlaceholder={`${l("Reconfirm Password")} (${l(
          "6 or more letters or numbers"
        )})`}
        signUpButtonText={l("Create")}
      />
    </DefaultContainer>
  );
}
