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
        // console.log(response);
        const dataList: any[] = response.data.result;
        const result: Record<string, any>[] = [];
        if(dataList) {
          dataList.map(data => {
            result.push({
              title: data.titleInfo,
              author: data.authorInfo,
            });
          });
          resolve(result);
        } else {
          resolve([]);
        }
      })
      .catch((error) => reject(error));
  });
};
