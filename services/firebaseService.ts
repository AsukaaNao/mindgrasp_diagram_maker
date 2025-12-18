import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { SavedFile } from '../types';

// // TODO: Replace with your actual Firebase configuration
// const firebaseConfig = {
//   apiKey: "REPLACE_WITH_YOUR_API_KEY",
//   authDomain: "REPLACE_WITH_YOUR_PROJECT_ID.firebaseapp.com",
//   projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
//   storageBucket: "REPLACE_WITH_YOUR_PROJECT_ID.appspot.com",
//   messagingSenderId: "REPLACE_WITH_YOUR_SENDER_ID",
//   appId: "REPLACE_WITH_YOUR_APP_ID"
// };

const firebaseConfig = {
  apiKey: "AIzaSyB0FTzSfNOJh0dPzNBMUfay9G241EfQrmk",
  authDomain: "mindgrasp-140cd.firebaseapp.com",
  projectId: "mindgrasp-140cd",
  storageBucket: "mindgrasp-140cd.firebasestorage.app",
  messagingSenderId: "470317898220",
  appId: "1:470317898220:web:ab582f90c8f54efa6788c9"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTION_NAME = 'diagrams';

export const firebaseService = {
  /**
   * Save a diagram file to Firestore.
   * Creates a new document or overwrites an existing one based on ID.
   */
  saveFile: async (file: SavedFile): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION_NAME, file.id);
      await setDoc(docRef, file);
      console.log(`File saved to Firebase: ${file.id}`);
    } catch (e) {
      console.error("Error saving file to Firebase: ", e);
      throw e;
    }
  },

  /**
   * Retrieve all diagram files from Firestore.
   */
  getAllFiles: async (): Promise<SavedFile[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      const files: SavedFile[] = [];
      querySnapshot.forEach((doc) => {
        files.push(doc.data() as SavedFile);
      });
      // Sort by last modified descending
      return files.sort((a, b) => b.info.lastModified - a.info.lastModified);
    } catch (e) {
      console.error("Error fetching files from Firebase: ", e);
      // Return empty array so app doesn't crash on config error
      return [];
    }
  },

  /**
   * Delete a diagram file from Firestore by ID.
   */
  deleteFile: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      console.log(`File deleted from Firebase: ${id}`);
    } catch (e) {
      console.error("Error deleting file from Firebase: ", e);
      throw e;
    }
  }
};
