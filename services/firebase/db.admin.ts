import { admin } from "./firebase.admin";
import { defaultLimitNumber } from "./db";
import {
  WhereConfigType,
} from "@/types/types";
import { OrderByDirection } from "firebase/firestore";

// 서버에서 firestore의 where 조건문을 만들기 위한 함수
const makeRangeQueryFromServer = (
  ref: admin.firestore.Query<admin.firestore.DocumentData>,
  condition: WhereConfigType
) => {
  return ref.where(condition.field, condition.operator, condition.value);
};

// 서버에서 firestore의 where 조건문을 2가지 이상 만들기 위한 함수
const makeRangeQueriesFromServer = (
  ref: admin.firestore.Query<admin.firestore.DocumentData>,
  whereConfig: WhereConfigType[]
) => {
  let whereRef = ref;
  for (const condition of whereConfig) {
    whereRef = makeRangeQueryFromServer(whereRef, condition);
  }
  return whereRef;
};

// 서버에서 firestore의 schedule 데이터를 조회
const queryDataFromServer = async (
  whereConfig: WhereConfigType[],
  path: string,
  limitNumber: number = defaultLimitNumber,
  orderByField?: string,
  orderByDirection?: OrderByDirection
) => {
  const collectionRef = admin.firestore().collection(path);
  let whereRef = makeRangeQueriesFromServer(collectionRef, whereConfig);
  const dataList: admin.firestore.DocumentData[] = [];
  if(orderByField) whereRef = whereRef.orderBy(orderByField, orderByDirection);
  const querySnapshots = await whereRef.limit(limitNumber).get();
  querySnapshots.docs.forEach((doc: admin.firestore.QueryDocumentSnapshot<admin.firestore.DocumentData>) => {
    dataList.push({
      id: doc.id,
      ...doc.data()
    }||{});
  });
  // 조회 개수 제한 값보다 조회된 데이터가 적으면 더 이상 조회할 데이터가 없다고 판단 함
  const nextLastVisible =
  dataList.length < limitNumber
      ? null
      : querySnapshots.docs[querySnapshots.docs.length - 1].id;

  return {
    lastVisible: nextLastVisible,
    dataList: dataList
  };
};

export { queryDataFromServer };
