import "./globals.css";
import ReactQueryWrapper from "@/components/organisms/ReactQueryWrapper";
import RecoilRootWrapper from "@/components/organisms/RecoilRootWrapper";
import StyledComponentsRegistry from "../components/organisms/StyledComponentsRegistry";
import TranslationFromServer from "@/components/organisms/TranslationFromServer";
import ShowAlert from "@/components/organisms/ShowAlert";
import ShowToast from "@/components/organisms/ShowToast";

// 기본 메타 정보
export const metadata = {
  metadataBase: new URL('https://book-story.kisscuseme.com'),
  title: "Book Story",
  description: "Write a review",
  openGraph: {
    title: "Book Story",
    description: "Write a review",
    images: "/images/logo.png",
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

        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/images/icons/icon-192x192.png"></link>
        <meta name="msapplication-TileColor" content="#b988ff"></meta>
        <link
          href="/images/favicon.png"
          rel="icon"
          sizes="32x32"
        />
      </head>
      <body>
        <TranslationFromServer />
        <ReactQueryWrapper>
          <RecoilRootWrapper>
            <StyledComponentsRegistry>
              {children}
              <ShowAlert />
              <ShowToast />
            </StyledComponentsRegistry>
          </RecoilRootWrapper>
        </ReactQueryWrapper>
      </body>
    </html>
  );
}
