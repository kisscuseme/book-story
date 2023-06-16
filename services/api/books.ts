// https://www.nl.go.kr/NL/search/openApi/search.do?key=43177592ebcc8c511727678be582e083865ccbef6f5f8dcfb4bdb63f7db36465&kwd=%ED%86%A0%EC%A7%80

import axios from "axios";

export const getNLBooksData = (kwd: string) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.NEXT_PUBLIC_NL_OPEN_API_KEY;
    const url = "https://www.nl.go.kr/NL/search/openApi/search.do";
    let urlParams = new URLSearchParams("");
    urlParams.append("key", apiKey || "");
    urlParams.append("apiType", "json");
    urlParams.append("category", "도서");
    urlParams.append("kwd", kwd);
    axios({
      method: "get",
      url: `${url}?${urlParams.toString()}`,
    })
      .then(function (response) {
        console.log(response);
        resolve(response);
      })
      .catch((error) => reject(error));
  });
};
