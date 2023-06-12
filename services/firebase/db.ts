import {
  and,
  collection,
  doc,
  DocumentData,
  DocumentSnapshot,
  getDoc,
  getDocs,
  limit,
  orderBy,
  OrderByDirection,
  query,
  QueryDocumentSnapshot,
  runTransaction,
  startAfter,
  Timestamp,
  where,
  WithFieldValue,
  writeBatch,
} from "firebase/firestore";
import { firebaseDb } from "./firebase";
import { WhereConfigType } from "@/types/types";

// 한 번에 조회할 데이터 개수 제한
const defaultLimitNumber = 15;

// DB 루트 PATH
const language: string = "kr";
const dbRootPath: string = "languages/" + language;

// user db path 생성
const getUserPath = () => {
  return dbRootPath + "/users";
};

// firestore의 where 조건 생성
const makeRangeQuery = (whereConfig: WhereConfigType[]) => {
  const conditions = [];
  for (const condition of whereConfig) {
    conditions.push(
      where(condition.field, condition.operator, condition.value)
    );
  }
  return and(...conditions);
};

// 추가 데이터 조회 시 기준 점 오브젝트 조회 (서버와 클라이언트 데이터가 구조가 달라서 별도 조회 함)
const getLastVisible = async (path: string, docId: string) => {
  return await getDoc(doc(firebaseDb, path, docId));
};

// 클라이언트에서 firestore 데이터를 조회
const queryData = async (
  whereConfig: WhereConfigType[],
  path: string,
  lastVisible:
    | QueryDocumentSnapshot<DocumentData>
    | DocumentSnapshot<DocumentData>
    | string
    | null,
  orderByField: string,
  orderByDirection: OrderByDirection,
  limitNumber: number = defaultLimitNumber
) => {
  const currentQuery =
    lastVisible !== null
      ? query(
          collection(firebaseDb, path),
          makeRangeQuery(whereConfig),
          orderBy(orderByField, orderByDirection),
          startAfter(lastVisible),
          limit(limitNumber)
        )
      : query(
          collection(firebaseDb, path),
          makeRangeQuery(whereConfig),
          orderBy(orderByField, orderByDirection),
          limit(limitNumber)
        );
  const documentSnapshots = await getDocs(currentQuery);
  const dataList: DocumentData[] = [];
  documentSnapshots.forEach((doc) => {
    dataList.push(
      {
        id: doc.id,
        ...doc.data(),
      } || {}
    );
  });

  // 조회 개수 제한 값보다 조회된 데이터가 적으면 더 이상 조회할 데이터가 없다고 판단 함
  const nextLastVisible =
    dataList.length < limitNumber
      ? null
      : documentSnapshots.docs[documentSnapshots.docs.length - 1];
  return {
    lastVisible: nextLastVisible,
    dataList: dataList,
  };
};

// firebase 데이터 수정
const updateData = async (updateInfo: {
  path: string;
  docId: string;
  data: WithFieldValue<DocumentData>;
}) => {
  try {
    await runTransaction(firebaseDb, async (transaction) => {
      const dataDocRef = doc(firebaseDb, updateInfo.path, updateInfo.docId);
      const dataDoc = await transaction.get(dataDocRef);
      if (!dataDoc.exists()) {
        throw "Document does not exist!";
      }
      const data = {
        ...dataDoc.data(),
        ...updateInfo.data,
      };
      transaction.update(dataDocRef, data);
    });
    return updateInfo;
    // console.log("Transaction successfully committed!");
  } catch (e) {
    console.log("Transaction failed: ", e);
    return false;
  }
};

// firebase 데이터 추가
const insertData = async (insertInfo: {
  path: string;
  data: WithFieldValue<DocumentData>;
}) => {
  try{
    // Get a new write batch
    const batch = writeBatch(firebaseDb);
  
    const docRef = doc(collection(firebaseDb, insertInfo.path));
    const dataRef = doc(firebaseDb, insertInfo.path, docRef.id);
    const data = {
      timestamp: Timestamp.now(),
      ...insertInfo.data,
    };
    batch.set(dataRef, data);
  
    // Commit the batch
    await batch.commit();
  
    return { docId: docRef.id, ...insertInfo };
  } catch (e) {
    console.log("Transaction failed: ", e);
    return false;
  }
};

// firebase 데이터 삭제
const deleteData = async (deleteInfo: { path: string; docId: string }) => {
  try {
    // Get a new write batch
    const batch = writeBatch(firebaseDb);
  
    const scheduleRef = doc(firebaseDb, deleteInfo.path, deleteInfo.docId);
    batch.delete(scheduleRef);
  
    // Commit the batch
    await batch.commit();

    return deleteInfo;
  } catch (e) {
    console.log("Transaction failed: ", e);
    return false;
  }
};

// firebase 삭제 계정 표시
const markDeletedAccount = async (deletedUserInfo: { uid: string }) => {
  try {
    const userPath = getUserPath();

    // Get a new write batch
    const batch = writeBatch(firebaseDb);

    const userRef = doc(firebaseDb, userPath, deletedUserInfo.uid);
    batch.set(userRef, { status: "deleted" });

    // Commit the batch
    await batch.commit();

    return true;
  } catch (error: any) {
    console.log(error);
    return false;
  }
};

export {
  getUserPath,
  queryData,
  updateData,
  insertData,
  deleteData,
  defaultLimitNumber,
  getLastVisible,
  markDeletedAccount,
};
