import "./globals.css";
import ReactQueryWrapper from "@/components/organisms/ReactQueryWrapper";
import RecoilRootWrapper from "@/components/organisms/RecoilRootWrapper";
import StyledComponentsRegistry from "../components/organisms/StyledComponentsRegistry";
import TranslationFromServer from "@/components/organisms/TranslationFromServer";
import ShowAlert from "@/components/organisms/ShowAlert";

// 기본 메타 정보
export const metadata = {
  title: "Book Story",
  description: "Write down your feeling",
  openGraph: {
    title: "Book Story",
    description: "Write down your feeling",
    images: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          src="https://cdn.jsdelivr.net/npm/react/umd/react.production.min.js"
          crossOrigin="anonymous"
          defer
        ></script>

        <script
          src="https://cdn.jsdelivr.net/npm/react-dom/umd/react-dom.production.min.js"
          crossOrigin="anonymous"
          defer
        ></script>

        <script
          src="https://cdn.jsdelivr.net/npm/react-bootstrap@next/dist/react-bootstrap.min.js"
          crossOrigin="anonymous"
          defer
        ></script>

        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css"
          integrity="sha384-rbsA2VBKQhggwzxH7pPCaAqO46MgnOM80zW1RWuH61DGLwZJEdK2Kadq2F9CUG65"
          crossOrigin="anonymous"
        />

        <link
          rel="preload"
          as="font"
          type="font/woff"
          href="https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2201-2@1.0/GangwonEdu_OTFBoldA.woff"
          crossOrigin="anonymous"
        />

        {/* <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/images/icons/icon-192x192.png"></link>
        <meta name="msapplication-TileColor" content="#99aaf6"></meta>
        <link
          href="/images/favicon.ico"
          rel="icon"
          sizes="16x16"
        /> */}
      </head>
      <body>
        <TranslationFromServer />
        <ReactQueryWrapper>
          <RecoilRootWrapper>
            <StyledComponentsRegistry>
              {children}
              <ShowAlert />
            </StyledComponentsRegistry>
          </RecoilRootWrapper>
        </ReactQueryWrapper>
      </body>
    </html>
  );
}
