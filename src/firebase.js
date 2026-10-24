import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDqF4TO1a17kQNg3Peog161CoMQ5RpOPsg",
  authDomain: "yoso-67380.firebaseapp.com",
  projectId: "yoso-67380",
  storageBucket: "yoso-67380.firebasestorage.app",
  messagingSenderId: "91328892475",
  appId: "1:91328892475:web:fc5cf5a16433174648161e"
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);

// データベース(Firestore)の接続設定を外部に公開
export const db = getFirestore(app);
